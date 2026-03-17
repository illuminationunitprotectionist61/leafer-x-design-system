# npm 发布指南

## 📦 发布前准备

### 1. 注册 npm 账号

如果还没有 npm 账号，需要先注册：

```bash
# 在浏览器中访问
https://www.npmjs.com/signup

# 或者在命令行注册
npm adduser
```

### 2. 登录 npm

```bash
npm login
```

输入你的用户名、密码和邮箱。

### 3. 检查包名是否可用

```bash
npm search leafer-design-system
```

如果已经存在，需要修改 `package.json` 中的 `name` 字段。

---

## 🚀 发布步骤

### 第一步：更新版本号（可选）

```bash
# 如果是补丁版本（bug修复）
npm version patch

# 如果是小版本（新功能，向后兼容）
npm version minor

# 如果是大版本（破坏性变更）
npm version major
```

### 第二步：检查文件

确保以下文件已准备好：

- ✅ `package.json` - 包配置
- ✅ `README.md` - 说明文档
- ✅ `LICENSE` - 许可证
- ✅ `index.js` - 主入口
- ✅ `index.d.ts` - TypeScript 类型定义

### 第三步：测试安装

```bash
# 本地测试
npm pack

# 检查生成的包
ls -la *.tgz
```

### 第四步：发布

```bash
# 正式发布
npm publish

# 如果是作用域包（@username/package-name），需要公开访问
npm publish --access public
```

---

## 🔧 常见问题

### 1. 包名已被占用

```bash
# 修改 package.json 中的 name
{
  "name": "leafer-x-design-system"  // 或者其他可用名称
}
```

### 2. 版本号已存在

```bash
# 更新版本号
npm version patch
npm publish
```

### 3. 未登录

```bash
npm login
```

### 4. 邮箱未验证

访问 https://www.npmjs.com 并验证邮箱。

### 5. 双因素认证（2FA）

如果启用了 2FA，发布时需要：

```bash
npm publish --otp=123456
```

---

## 📋 发布检查清单

- [ ] npm 账号已注册
- [ ] 已登录 npm (`npm whoami` 检查)
- [ ] 包名可用
- [ ] 版本号正确
- [ ] README 完整
- [ ] LICENSE 已添加
- [ ] 主入口文件正确
- [ ] 依赖项已声明
- [ ] `.gitignore` 已配置（排除 node_modules）
- [ ] `.npmignore` 已配置（可选）

---

## 🔄 更新包

### 更新版本

```bash
# 自动更新版本号并创建 git 标签
npm version patch

# 推送标签到 GitHub
git push --follow-tags

# 发布
npm publish
```

### 废弃版本

```bash
npm deprecate leafer-design-system@2.0.0 "This version has bugs"
```

### 删除包（24小时内）

```bash
npm unpublish leafer-design-system --force
```

---

## 📝 发布后的操作

### 1. 创建 GitHub Release

```bash
# 推送标签
git push origin v2.0.0
```

然后在 GitHub 上创建 Release，添加更新日志。

### 2. 更新文档

在 README 中添加安装命令：

```markdown
## 安装

```bash
npm install leafer-design-system
```
```

### 3. 通知社区

- 在 LeaferJS 社区分享
- 发布到社交媒体
- 更新个人博客

---

## 💡 最佳实践

1. **使用语义化版本**: MAJOR.MINOR.PATCH
2. **编写清晰的 README**: 包含安装、使用、API 文档
3. **添加 CHANGELOG**: 记录每个版本的变更
4. **使用标签**: 发布时创建 git 标签
5. **测试后再发布**: 确保包可以正常安装和使用

---

## 🆘 获取帮助

- npm 文档: https://docs.npmjs.com/
- npm 支持: https://www.npmjs.com/support
- 社区论坛: https://github.com/npm/feedback

---

**祝你发布顺利！** 🎉
