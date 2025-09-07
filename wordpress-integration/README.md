# WordPress Integration for Archalley Newsletter

This directory contains the WordPress plugin files for integrating newsletter subscription forms with your Archalley newsletter platform.

## Installation

1. Upload all files to your WordPress site's `wp-content/plugins/archalley-newsletter/` directory
2. Activate the plugin from the WordPress admin dashboard
3. The plugin will automatically register shortcodes and widgets

## Usage

### Shortcode

Use the `[archalley_newsletter]` shortcode anywhere in your posts or pages:

```php
[archalley_newsletter]
```

#### Shortcode Parameters

- `title` - Form title (default: "Subscribe to Our Newsletter")
- `description` - Form description text
- `email_list_id` - The ID of the email list to subscribe to (get from admin panel)
- `button_text` - Subscribe button text (default: "Subscribe")
- `style` - Form style: "default", "minimal", or "modern"

#### Examples

```php
[archalley_newsletter title="Get Updates" description="Stay informed about new architecture projects" email_list_id="your-list-id" style="modern"]
```

### Widget

1. Go to Appearance > Widgets in your WordPress admin
2. Add the "Archalley Newsletter Subscription" widget to any sidebar
3. Configure the widget settings
4. Save the widget

### Styles

The plugin includes three pre-designed styles:

#### Default Style
- Clean white background
- Orange border and buttons
- Professional appearance

#### Minimal Style
- Transparent background
- Minimal borders
- Compact design

#### Modern Style
- Orange gradient background
- White text and inputs
- Eye-catching design

## Configuration

### API URL
Update the `$api_base_url` in `newsletter-subscription.php` to point to your newsletter platform:

```php
private $api_base_url = 'https://your-newsletter-domain.com/api';
```

### Email List IDs
Get email list IDs from your newsletter admin panel and use them in shortcodes or widget settings.

## Customization

### Custom Styles
Add custom CSS to your theme's `style.css` or use the WordPress Customizer:

```css
.archalley-newsletter-form {
    /* Your custom styles */
}
```

### Form Fields
The plugin currently supports email-only subscription. To add more fields, modify the form rendering and AJAX handling functions.

## Troubleshooting

### Form Not Submitting
1. Check that JavaScript is enabled
2. Verify the API URL is correct
3. Check browser console for errors

### CORS Errors
Ensure your newsletter platform API has CORS configured for your WordPress domain.

### Styling Issues
Check that the CSS file is loading correctly and not being overridden by theme styles.

## Files Included

- `newsletter-subscription.php` - Main plugin file
- `newsletter.js` - JavaScript for form handling
- `newsletter.css` - Styles for the subscription forms
- `README.md` - This documentation

## Support

For technical support, contact your development team or refer to the main project documentation.
