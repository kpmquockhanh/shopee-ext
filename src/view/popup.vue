<template>
    <div class="main_app">
        <div class="d-flex align-center" style="gap: 4px">
            <span class="justify-start label" style="flex-basis: 80px">Your Email:</span>
            <v-badge class="flex-grow-1">{{ email || 'N/A' }}</v-badge>
        </div>
        <div class="d-flex align-center my-3" style="gap: 4px">
            <span class="label">Shop ID:</span>
            <v-badge class="flex-grow-1">{{ resId || 'N/A' }}</v-badge>
        </div>
        <div class="d-flex align-center" style="gap: 4px">
            <span class="label">Auth key:</span>
            <v-badge class="flex-grow-1">{{ authKey || 'N/A' }}</v-badge>
        </div>
        <div class="mt-3" style="gap: 4px">
            <span class="label">Cart info</span>
            <div class="ml-3 mt-3 d-flex gap-8 flex-column">
                <div>
                    <span class="label">Token: </span>
                    <v-badge class="flex-grow-1 ml-3">{{ cartToken || 'N/A' }}</v-badge>
                </div>
                <div>
                    <span class="label">Owner: </span>
                    <v-badge class="flex-grow-1 ml-3">{{ cartCreatedBy || 'N/A' }}
                        <strong>{{ isOwner ? 'owned' : '' }}</strong></v-badge>
                </div>
                <div>
                    <span class="label">SubTotal price: </span>
                    <v-badge class="flex-grow-1 ml-3">{{ cartSubTotal || 'N/A' | formatCurrency }}</v-badge>
                </div>
            </div>
        </div>
        <div class="d-flex mt-3 action-btn" style="gap: 8px">
            <button v-if="isOwner" class="ant-btn ant-btn-danger" type="button" @click="onDeleteCart">
                <span>Delete cart</span>
            </button>

            <button class="ant-btn ant-btn-dashed" type="button" @click="onDeleteCart">
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
