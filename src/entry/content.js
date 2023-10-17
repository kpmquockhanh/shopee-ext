console.log('Shopee Food helper starting....')

const DOMAIN = 'https://shop.kpmquockhanh.site/api/v1'
// const DOMAIN = 'http://localhost:3000/api/v1'
const getHeader = function () {
  const {isShare} = getToken()
  return {
    "Content-Type": "application/json",
    "x-kpm-token": getAuthKey(),
    "x-kpm-shared": isShare,
  }
}
const getAuthKey = function () {
  return localStorage.getItem(`kpm_auth_${shopInfo.restaurant_id}`)
}

let shopeeInfo = {}

async function getUserInfo() {
  return chrome.runtime.sendMessage({type: "get-info"});
}

chrome.runtime.onMessage.addListener(
  async function (request, sender, sendResponse) {
    switch (request.type) {
      case 'get-shop':
        sendResponse({
          restaurant_id: shopInfo.restaurant_id,
          auth_key: getAuthKey(),
          cart: cartData,
        });
        break
      case 'delete-cart': {
        const resp = await fetch(`${DOMAIN}/cart/${getToken().token}/delete`, {
          method: "delete",
          headers: getHeader(),
        })

        const response = await resp.json()
        sendResponse({status: !!response.status})
        if (response.status) {
          window.location.reload()
        }
        break
      }
    }
  }
);


async function getShopInfo() {
  const resp = await fetch(`${DOMAIN}/shops/get_from_url?url=${window.location.pathname.replace('/', '')}`);
  shopInfo = (await resp.json()).data;
}

getShopeeToken()

function showError(error) {
  const qrCode = document.querySelector('#QRcode')
  const newDom = document.createElement('div')
  newDom.innerHTML = `<div class="alert alert-danger" role="alert">${error}</div>`
  qrCode.prepend(newDom)
}

getUserInfo().then(async function (info) {
  if (!info.email) {
    waitForElm('#QRcode').then(async () => {
      showError('Please login google account to use this extension')
    })
    return
  }
  await getShopInfo()
  if (!shopInfo || !shopInfo.restaurant_id) {
    return
  }
  fetchCategories().then()

  waitForElm('#QRcode').then(async () => {
    await fetchCart(info)
  })

  waitForElm('body .btn-adding').then(() => {
    setInterval(() => {
      document.querySelectorAll('body .btn-adding').forEach((btn) => {
        console.log('set add to cart', btn.closest('.row').parentElement.parentElement.querySelector('.item-restaurant-name'))
        btn.addEventListener('click', (e) => {
          bindAddBtn(e, info)
        })
      })
    }, 1000)
  });
})

async function bindAddBtn(e, info) {
  console.log('click add to cart', e.target)
  e.preventDefault()
  await addToCart(e, info)
  await fetchCart(info)
}

let shopInfo = {}
let categories = []
let cartData = {
  cartItems: [],
}

async function fetchCategories() {
  const resp = await fetch(`${DOMAIN}/products/${shopInfo.restaurant_id}`);
  categories = (await resp.json()).data;
}

async function addToCart(e, info) {
  const domName = e.target.closest('.row').parentElement.parentElement.querySelector('.item-restaurant-name')
  console.log('domName', domName)
  if (!domName) {
    alert('Error: No product name found')
    return
  }
  const name = domName.innerText;
  let selectedProduct = {}
  categories.forEach((category) => {
    category.dishes.forEach((dish) => {
      const dName = dish.name.replace(/\s+/g, ' ').trim()
      const oName = name.replace(/\s+/g, ' ').trim()
      if (dName === oName) {
        selectedProduct = dish
      }
    })
  })
  if (!selectedProduct || !selectedProduct.id) {
    alert('Error: No product found')
    return
  }

  const requestProduct = {
    id: selectedProduct.id,
    name: selectedProduct.name,
    quantity: 1,
    price: selectedProduct.price,
    // image: selectedProduct.pictures[0].url,
  }
  if (selectedProduct.pictures && selectedProduct.pictures[0]) {
    requestProduct.image = selectedProduct.pictures[0].url
  }
  const carItems = (cartData.cartItems || []).find((item) => Number(item.product.id) === selectedProduct.id && item.addedBy === info.email)
  if (carItems) {
    requestProduct.quantity = carItems.product.quantity + 1
  }

  const {token} = getToken()
  return await fetch(`${DOMAIN}/cart/${token}/update`, {
    method: 'POST',
    headers: getHeader(),
    body: JSON.stringify({
      product: requestProduct,
      addedBy: info.email,
      resId: shopInfo.restaurant_id,
    }),
  })
}

async function fetchCart({email}) {
  cartData = await getOrInitCart(email)
  if (!cartData) {
    return
  }
  fillCart()
  bindEventCart(email)

  updateParams('fetchCart')
}

function updateParams(target) {
  const url = new URL(window.location.href);
  url.searchParams.delete('group');
  url.searchParams.set('group', getToken(target === 'newItem').token);

  const nextURL = url.toString()
  const nextState = { additionalInformation: 'Update token by extension' };

  window.history.replaceState(nextState, '', nextURL);

}

function bindEventCart(email) {
  const syncButton = document.querySelector('#sync-btn')
  if (syncButton) {
    document.querySelector('#sync-btn').addEventListener('click', async () => {
      const parsedShopeeInfo = JSON.parse(shopeeInfo)
      if (!parsedShopeeInfo || !parsedShopeeInfo.token) {
        showError('Please login shopee to sync')
        return
      }
      const {token} = getToken()
      const respSync = await fetch(`${DOMAIN}/cart/${token}/sync`, {
        method: "post",
        headers: getHeader(),
        body: JSON.stringify({
          createdBy: email,
          token: parsedShopeeInfo.token,
        }),
      })
      if (respSync.status !== 200) {
        const j = await respSync.json()
        alert(j.data)
        return
      }
      fetchCart({email}).then()
      // alert('Sync done, please scan QR code to review and checkout')
    })
  }
  document.querySelector('#share-btn').addEventListener('click', async () => {
    const {token} = getToken()
    const url = new URL(window.location.href);
    url.searchParams.delete('group');
    url.searchParams.set('group', token);
    await navigator.clipboard.writeText(url.toString());
    alert('Copied to clipboard');
  })

  document.querySelectorAll('.remove-cart-item-btn').forEach((ele) => {
    ele.addEventListener('click', async (e) => {

      const {token} = getToken()
      await fetch(`${DOMAIN}/cart/${token}/remove`, {
        method: "delete",
        headers: getHeader(),
        body: JSON.stringify({
          id: e.target.dataset.id,
          addedBy: email,
        }),
      })
      fetchCart({email}).then()
    })
  })
}

function fillCart() {
  const qrCode = document.querySelector('#QRcode')
  qrCode.style.borderRadius = '4px'
  qrCode.style.paddingTop = '10px'
  let subTotal = 0
  let items = `<div>Created by: <strong>${cartData.createdBy}${cartData.isOwner ? ' (owner)' : ''}</strong></div>`
  if (cartData.cartItems) {
    cartData.cartItems.forEach((item) => {
      let removeCartBtn = ''
      if (item.removable) {
        removeCartBtn = `
         <div class="remove-cart-item-btn txt-right">
            <div style="
              display: flex;
              justify-content: center;
              width: 22px;
              height: 22px;
              background-color: #333;
              border-radius: 4px;
              font-weight: bold;
              cursor: pointer"
              data-id="${item._id}">
              -
            </div>
          </div>
        `
      }
      subTotal += item.product.price * item.product.quantity
      items += `<div style="display: flex; align-items: center; padding: 12px">
        <div style="margin-right: 8px">
            <img style="width: 50px; border-radius: 3px;" src="${item.product.image}" alt="${item.product.name}" srcset=""/>
        </div>
        <div style="display: flex; justify-content: space-between;flex-grow: 1">
          <div style="text-align: left; margin-left: 4px;">
            <div>${item.product.name} x ${item.product.quantity}</div>
            <div><strong>${formatCurrency(item.product.price)}</strong></div>
            <div style="font-size: 11px;font-style: italic">Added by: <strong>${item.addedBy}</strong></div>
          </div>
          ${removeCartBtn}
        </div>
      </div>`
    })
  }
  document.querySelectorAll('.cart-items').forEach((ele) => {
    ele.remove()
  })
  let syncButton = ''
  if (!cartData.isSync) {
    syncButton = `<div id="sync-btn" style="flex: 1; padding: 16px 0; background-color: #333; cursor:pointer;border-radius: 6px">Sync to shopee cart</div>`
  } else {
    syncButton = `<div style="flex: 1;">Sync done, please scan QR code to review and checkout</div>`
  }
  if (!cartData.isOwner) {
    syncButton = ''
  }
  const newDom = document.createElement('div')
  newDom.classList.add('cart-items')
  newDom.innerHTML = `
    <div>
        ${items}
    </div>
    <div>
        Subtotal: <strong>${formatCurrency(subTotal)}</strong>
    </div>
    <div style="display: flex;margin: 8px 12px 16px 12px;gap:8px;align-items: center">
        ${syncButton}
        <div 
          id="share-btn"
           style="padding: 16px 8px; background-color: #555; cursor:pointer;border-radius: 6px;${syncButton ? '' : 'flex-grow: 1'}">
           Share
         </div>
    </div>
    `;
  qrCode.style.backgroundImage = 'unset'
  qrCode.style.backgroundColor = '#ee4d2d'
  qrCode.prepend(newDom)
}

function getToken(isNew = false) {
  const url = new URL(window.location.href);
  const searchParams = url.searchParams;

  const sharedToken = searchParams.get('group');
  if (sharedToken && !isNew) {
    return {
      token: sharedToken,
      isShare: true,
    };
  }

  return {
    token: localStorage.getItem(`kpm_token_${shopInfo.restaurant_id}`) || 'new',
    isShare: false,
  };
}

async function getOrInitCart(owner) {
  const {token} = getToken()
  let resp = await fetch(`${DOMAIN}/cart/${token}?hash=${owner}&resId=${shopInfo.restaurant_id}`, {
    headers: getHeader(),
  })
  resp = await resp.json()
  if (resp.code !== '00000') {
    alert("Error: " + resp.data)
    return
  }
  if (resp.data?.isNew) {
    localStorage.setItem(`kpm_token_${shopInfo.restaurant_id}`, resp.data.id)
    localStorage.setItem(`kpm_auth_${shopInfo.restaurant_id}`, resp.data.authKey)
    updateParams('newItem')
  }
  return resp.data
}

function waitForElm(selector) {
  return new Promise(resolve => {
    if (document.querySelector(selector)) {
      return resolve(document.querySelector(selector));
    }

    const observer = new MutationObserver(() => {
      if (document.querySelector(selector)) {
        resolve(document.querySelector(selector));
        observer.disconnect();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  });
}

function getShopeeToken() {
  const request = indexedDB.open('localforage')
  request.onerror = (error) => {
    console.error(error)
  }
  request.onsuccess = (event) => {
    const db = event.target.result

    const transaction = db.transaction('keyvaluepairs', 'readonly')

    const objectStore = transaction.objectStore('keyvaluepairs')
    const req = objectStore.get('reduxPersist:auth')
    req.onerror = (e) => {
      console.log('error', e)
    }
    req.onsuccess = (result) => {
      shopeeInfo = result.target.result
    }
  }
}

function formatCurrency(price) {
  if (!price) {
    return 0
  }
  return price.toLocaleString('it-IT', {style: 'currency', currency: 'VND'});
}
