module.exports = {
    extends: [
        '@jitsi/eslint-config'
    ],
    rules: {
        '@typescript-eslint/no-unused-vars': 'off',
        // 禁用对象属性间距规则
        'key-spacing': 'off',
        // 禁用注释间距规则
        'spaced-comment': 'off',
        // 禁用对象字面量属性间距规则
        'object-property-newline': 'off',
        // 禁用引号规则
        'quotes': 'off',
        // 禁用 JSX 引号规则
        'jsx-quotes': 'off',
        // 禁用对象大括号间距规则
        'object-curly-spacing': 'off',
        // 禁用数组大括号间距规则
        'array-bracket-spacing': 'off',
        // 禁用计算属性间距规则
        'computed-property-spacing': 'off',
        // 禁用模板字符串间距规则
        'template-curly-spacing': 'off',
        // 禁用 JSX 属性间距规则
        'react/jsx-curly-spacing': 'off',
        // 禁用 JSX 属性换行规则
        'react/jsx-max-props-per-line': 'off',
        // 禁用 JSX 属性排序规则
        'react/jsx-sort-props': 'off',
        // 禁用导入排序规则
        'import/order': 'off'
    }
};
