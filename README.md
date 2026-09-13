# **The Ultimate Discord Bot integration with Stripe!**

StripeCord is a simple, free solution to seamlessly integrate Stripe and Discord. It connects directly to the Stripe API, with no extra fees involved. Your customers just enter the email they used for their Stripe subscription through a Discord command and get instant access.

## ✨ Features

- 🔗 **Self-service linking**: members link their Stripe email via a slash command or a one-click button.
- ⚡ **Instant webhook sync**: roles update the moment a subscription is created, renewed, canceled, or fails to pay.
- 🛡️ **Cron safe guard**: keep the classic periodic full-database check running alongside webhooks (or on its own).
- 🎭 **Multi-plan roles**: map each Stripe price/plan to its own Discord role, or run in single-role legacy mode.
- 🧹 **Self-healing**: safety check removes roles from unauthorized holders; inactivity check prunes stale entries.
- 🗄️ **MongoDB-backed**: connects directly to the Stripe API, no middleman, no extra fees.

<img width="1744" height="902" alt="banner" src="https://github.com/user-attachments/assets/a6b1d051-8627-45f8-9f1e-740f71762255" />

**Safe Contributions!** 💸

---

## StripeCord v3 is now available!

StripeCord v3 introduces **Stripe webhooks** for instant role updates: instead of waiting for the periodic cron check, roles are synced the moment a subscription changes on Stripe, faster for your members and far fewer API requests. The legacy cron check is still available and can run alongside webhooks as a safe guard.

If anyone would like to help, I would be grateful if you could make PRs or create a issue for enhancement features or bugs found. Any [Ko-Fis](https://ko-fi.com/rodaviva) given would be greatly welcome to allow me to continue to mantain this project development.

## Wiki / Documentation

Please check the [Wiki / Docs](https://github.com/Rodaviva29/StripeCord/wiki) to get started with this project and to see all the awesome features.

⭐ **Cloud Hosted Free configuration available** within minutes and Self Hosted configuration for the geeks.

---

We hope you enjoy using Stripe Cord. If you have any questions or issues, feel free to contact me on Discord (prefereble) or via chat in https://chung-jf.me. My Discord nickname is `Rodaviva`.

