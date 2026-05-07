// Mock mínimo de react-native para tests de Node.js
// Solo expone lo que react-native-url-polyfill necesita: Platform
module.exports = {
  Platform: {
    OS: 'ios',
    select: (obj) => obj.ios ?? obj.default,
  },
};
