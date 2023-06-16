<template>
    <div class="main_app ma-10" style="width: 250px">
        <div class="d-flex align-center" style="gap: 4px">
            <span style="flex-basis: 80px" class="justify-start">Email:</span>
            <v-badge class="flex-grow-1">{{ email || 'N/A' }}</v-badge>
        </div>
        <div class="d-flex align-center my-3" style="gap: 4px">
            <span style="flex-basis: 80px">Shop ID:</span>
            <v-badge class="flex-grow-1">{{ resId || 'N/A' }}</v-badge>
        </div>
        <div class="d-flex align-center" style="gap: 4px">
            <span style="flex-basis: 80px">Auth key:</span>
            <v-input v-model="authKey" class="flex-grow-1" allow-clear/>
        </div>
        <div class="d-flex align-center mt-3" style="gap: 4px">
            <span style="flex-basis: 80px" @click="onClearToken">Cart token</span>
            <v-input v-model="cartToken" class="flex-grow-1"/>
        </div>
        <div class="d-flex flex-column mt-3">
            <button type="button" class="ant-btn ant-btn-primary" @click="onClearToken">
                <span>Clear cart</span>
            </button>

            <button type="button" class="ant-btn ant-btn-dashed mt-2" @click="onClearToken">
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
      cartToken: ''
    }
  },
  methods: {
    async onClearToken() {
      console.log('onClearToken')
      // const resp = await chrome.runtime.sendMessage({type: "clear-cart"});

      const [tab] = await chrome.tabs.query({active: true});
      console.log('tab', tab);
      const response = await chrome.tabs.sendMessage(tab.id, {greeting: "hello"});
      // do something with response here, not outside the function
      console.log(response);
      // console.log(resp)
    }
  },
  created() {
    console.log('created')
  },
}

</script>

<style>
.main_app {
    font-family: 'Avenir', Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    color: #2c3e50;
}
</style>
