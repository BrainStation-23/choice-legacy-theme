# Shopify Theme

A modern, responsive, and customizable Shopify theme designed to help merchants launch and scale their online stores with ease.

## ✨ Features

- 🎨 Fully responsive design (mobile, tablet, desktop)
- ⚡ Optimized for speed and SEO
- 🛒 Customizable product pages and collections
- 📦 Built-in support for Shopify sections and blocks
- 🌙 Dark/Light mode support (optional)
- 🧩 Easy integration with Shopify Apps
- 📑 SEO-friendly meta structure

## 📂 Folder Structure

```
/theme
  ├── assets/        # Stylesheets, JavaScript, images
  ├── config/        # Theme settings (settings_schema.json, settings_data.json)
  ├── layout/        # theme.liquid
  ├── locales/       # Translations
  ├── sections/      # Reusable sections
  ├── snippets/      # Small reusable code blocks
  └── templates/     # Page templates (product.liquid, collection.liquid, etc.)
```

## 🚀 Installation

1. Clone or download this repository:

   ```bash
   git clone https://github.com/BrainStation-23/choice-legacy-theme
   ```

2. Install the [Shopify CLI](https://shopify.dev/docs/themes/tools/cli)

3. Navigate to your theme directory:

   ```bash
   cd your-theme
   ```

4. Authenticate with Shopify:

   ```bash
   shopify login --store your-store-name.myshopify.com
   ```

5. Run the development server:

   ```bash
   shopify theme dev
   ```

6. Push changes to your store:
   ```bash
   shopify theme push
   ```

## 📝 Customization

- Modify `settings_schema.json` to add new theme settings
- Add new sections inside `/sections`
- Use Liquid, HTML, CSS, and JavaScript for customization

## 📄 License

This theme is licensed under the [MIT License](LICENSE).
