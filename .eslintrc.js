module.exports = {
    "env": {
        "es6": true,
        "node": true
    },
    "extends": "eslint:recommended",
    "rules": {
        "no-var": 0,
        "no-console": "off",
        "no-unused-vars": ["error", { "vars": "all", "args": "none"}]
    }
};