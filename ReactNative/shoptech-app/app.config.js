const IS_SHIPPER = process.env.APP_VARIANT === 'shipper';

export default {
  expo: {
    name: IS_SHIPPER ? "ShopTech Shipper" : "shoptech-app",
    slug: "shoptech-app",
    version: "1.0.0",
    orientation: "portrait",
    icon: IS_SHIPPER ? "./assets/icon-shipper.png" : "./assets/icon-customer.png",
    userInterfaceStyle: "light",
    newArchEnabled: false,
    scheme: IS_SHIPPER ? "shoptech-shipper" : "shoptech",
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: IS_SHIPPER ? "com.shoptech.shipper" : "com.shoptech.app"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: IS_SHIPPER ? "./assets/icon-shipper.png" : "./assets/icon-customer.png",
        backgroundColor: "#ffffff"
      },
      package: IS_SHIPPER ? "com.shoptech.shipper" : "com.shoptech.app",
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      usesCleartextTraffic: true
    },
    plugins: [],
    web: {
      favicon: "./assets/favicon.png"
    },
    extra: {
      variant: process.env.APP_VARIANT || 'customer',
      eas: {
        projectId: "e40f36ee-cb39-43db-a03f-b48eb67bc764"
      }
    }
  }
}
