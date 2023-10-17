<template>
  <div class="main_app bg-zinc-100">
    <div class="flex items-center justify-between gap-4">
      <span class="justify-start label">Your Email:</span>
      <div class="flex-grow-1">{{ email || 'N/A' }}</div>
    </div>
    <div class="flex items-center justify-between gap-4">
      <span class="label">Shop ID:</span>
      <div class="flex-grow-1">{{ resId || 'N/A' }}</div>
    </div>
    <div class="flex items-center justify-between gap-4">
      <span class="label">Auth key:</span>
      <div>{{ authKey || 'N/A' }}</div>
    </div>
    <div class="mt-3">
      <span class="label">Cart info</span>
      <div class="ml-3 flex flex-col mt-2">
        <div>
          <span class="label">Token: </span>
          <span class="flex-grow ml-3">{{ cartToken || 'N/A' }}</span>
        </div>
        <div>
          <span class="label">Owner: </span>
          <span class="flex-grow ml-3">{{ cartCreatedBy || 'N/A' }}
            <strong>{{ isOwner ? 'owned' : '' }}</strong></span>
        </div>
        <div>
          <span class="label">SubTotal price: </span>
          <span class="flex-grow ml-3">{{ cartSubTotal || 'N/A' | formatCurrency }}</span>
        </div>
      </div>
    </div>
    <div class="flex mt-3 action-btn gap-4">
      <button v-if="isOwner" class="bg-sky-500 hover:bg-sky-700 rounded-md p-2" @click="onDeleteCart">
        <span>Delete cart</span>
      </button>

      <button class="bg-red-500 hover:bg-red-700 rounded-md p-2" @click="onDeleteCart">
        <span>Reset data</span>
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'popupView',
  data() {
    return {
      email: '',
      resId: 0,
      authKey: '',
      cart: {},
    }
  },
  computed: {
    cartToken() {
      return this.cart?.id
    },
    cartCreatedBy() {
      return this.cart?.createdBy
    },
    cartSubTotal() {
      return this.cart?.cartItems?.reduce((acc, item) => {
        return acc + (item.product.price || 0) * (item.product.quantity || 1)
      }, 0)
    },
    isOwner() {
      return this.cart?.isOwner
    },
  },
  methods: {
    async onDeleteCart() {
      if (!this.resId) return
      const [tab] = await chrome.tabs.query({active: true});
      if (!tab) return
      await chrome.tabs.sendMessage(tab.id, {type: "delete-cart"});
    },
    async getTab() {
      const [tab] = await chrome.tabs.query({active: true});
      return tab
    },
  },
  async created() {
    const {email} = await chrome.runtime.sendMessage({type: "get-info"});
    if (email) {
      this.email = email
    }
    const tab = await this.getTab();

    await chrome.tabs.sendMessage(tab.id, {type: 'get-shop'}, (resp) => {
      if (!resp) {
        return
      }
      const {restaurant_id, auth_key, cart} = resp
      if (restaurant_id) {
        this.resId = restaurant_id
      }
      if (auth_key) {
        this.authKey = auth_key
      }

      if (cart) {
        this.cart = cart
      }
    });
  },
  filters: {
    formatCurrency(price) {
      if (price === 'N/A') {
        return price
      }
      if (!price) {
        return 0
      }
      return price.toLocaleString('it-IT', {style: 'currency', currency: 'VND'});
    }
  }
}

</script>
