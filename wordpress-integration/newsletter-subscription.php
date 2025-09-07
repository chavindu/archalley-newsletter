<?php
/**
 * Archalley Newsletter Subscription Plugin
 * 
 * Plugin Name: Archalley Newsletter Subscription
 * Description: Newsletter subscription form for Archalley website
 * Version: 1.0.0
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

class ArchalleyNewsletterSubscription {
    private $api_base_url;
    
    public function __construct() {
        $this->api_base_url = 'http://localhost:3000/api'; // Change to your production URL
        
        add_action('wp_enqueue_scripts', array($this, 'enqueue_scripts'));
        add_shortcode('archalley_newsletter', array($this, 'newsletter_shortcode'));
        add_action('wp_ajax_subscribe_newsletter', array($this, 'handle_subscription'));
        add_action('wp_ajax_nopriv_subscribe_newsletter', array($this, 'handle_subscription'));
        add_action('widgets_init', array($this, 'register_widget'));
    }
    
    public function enqueue_scripts() {
        wp_enqueue_script('jquery');
        wp_enqueue_script(
            'archalley-newsletter',
            plugin_dir_url(__FILE__) . 'newsletter.js',
            array('jquery'),
            '1.0.0',
            true
        );
        
        wp_localize_script('archalley-newsletter', 'archalley_ajax', array(
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('archalley_newsletter_nonce'),
            'api_url' => $this->api_base_url
        ));
        
        wp_enqueue_style(
            'archalley-newsletter-style',
            plugin_dir_url(__FILE__) . 'newsletter.css',
            array(),
            '1.0.0'
        );
    }
    
    public function newsletter_shortcode($atts) {
        $atts = shortcode_atts(array(
            'title' => 'Subscribe to Our Newsletter',
            'description' => 'Get the latest architecture and design updates delivered to your inbox.',
            'email_list_id' => '', // Default email list ID
            'button_text' => 'Subscribe',
            'style' => 'default' // default, minimal, modern
        ), $atts);
        
        return $this->render_subscription_form($atts);
    }
    
    private function render_subscription_form($atts) {
        ob_start();
        ?>
        <div class="archalley-newsletter-form archalley-newsletter-<?php echo esc_attr($atts['style']); ?>">
            <div class="archalley-newsletter-content">
                <?php if (!empty($atts['title'])): ?>
                    <h3 class="archalley-newsletter-title"><?php echo esc_html($atts['title']); ?></h3>
                <?php endif; ?>
                
                <?php if (!empty($atts['description'])): ?>
                    <p class="archalley-newsletter-description"><?php echo esc_html($atts['description']); ?></p>
                <?php endif; ?>
                
                <form class="archalley-newsletter-subscribe-form" data-email-list-id="<?php echo esc_attr($atts['email_list_id']); ?>">
                    <div class="archalley-newsletter-input-group">
                        <input 
                            type="email" 
                            name="email" 
                            placeholder="Enter your email address" 
                            required 
                            class="archalley-newsletter-email-input"
                        >
                        <button type="submit" class="archalley-newsletter-submit-btn">
                            <?php echo esc_html($atts['button_text']); ?>
                        </button>
                    </div>
                    <div class="archalley-newsletter-message"></div>
                </form>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }
    
    public function handle_subscription() {
        check_ajax_referer('archalley_newsletter_nonce', 'nonce');
        
        $email = sanitize_email($_POST['email']);
        $email_list_id = sanitize_text_field($_POST['email_list_id']);
        
        if (!is_email($email)) {
            wp_send_json_error('Invalid email address');
            return;
        }
        
        // Make API call to subscription endpoint
        $response = wp_remote_post($this->api_base_url . '/subscribe', array(
            'headers' => array('Content-Type' => 'application/json'),
            'body' => json_encode(array(
                'email' => $email,
                'emailListId' => $email_list_id
            )),
            'timeout' => 30
        ));
        
        if (is_wp_error($response)) {
            wp_send_json_error('Failed to subscribe. Please try again later.');
            return;
        }
        
        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);
        
        if ($data && isset($data['message'])) {
            wp_send_json_success($data['message']);
        } else {
            wp_send_json_error('Failed to subscribe. Please try again later.');
        }
    }
    
    public function register_widget() {
        register_widget('Archalley_Newsletter_Widget');
    }
}

// Widget Class
class Archalley_Newsletter_Widget extends WP_Widget {
    public function __construct() {
        parent::__construct(
            'archalley_newsletter_widget',
            'Archalley Newsletter Subscription',
            array('description' => 'Add a newsletter subscription form to your sidebar')
        );
    }
    
    public function widget($args, $instance) {
        echo $args['before_widget'];
        
        $title = !empty($instance['title']) ? $instance['title'] : 'Subscribe to Newsletter';
        $description = !empty($instance['description']) ? $instance['description'] : 'Get updates delivered to your inbox.';
        $email_list_id = !empty($instance['email_list_id']) ? $instance['email_list_id'] : '';
        
        $shortcode_atts = array(
            'title' => $title,
            'description' => $description,
            'email_list_id' => $email_list_id,
            'style' => 'minimal'
        );
        
        $newsletter_form = new ArchalleyNewsletterSubscription();
        echo $newsletter_form->newsletter_shortcode($shortcode_atts);
        
        echo $args['after_widget'];
    }
    
    public function form($instance) {
        $title = !empty($instance['title']) ? $instance['title'] : 'Subscribe to Newsletter';
        $description = !empty($instance['description']) ? $instance['description'] : 'Get updates delivered to your inbox.';
        $email_list_id = !empty($instance['email_list_id']) ? $instance['email_list_id'] : '';
        ?>
        <p>
            <label for="<?php echo $this->get_field_id('title'); ?>">Title:</label>
            <input class="widefat" id="<?php echo $this->get_field_id('title'); ?>" name="<?php echo $this->get_field_name('title'); ?>" type="text" value="<?php echo esc_attr($title); ?>">
        </p>
        <p>
            <label for="<?php echo $this->get_field_id('description'); ?>">Description:</label>
            <textarea class="widefat" id="<?php echo $this->get_field_id('description'); ?>" name="<?php echo $this->get_field_name('description'); ?>"><?php echo esc_textarea($description); ?></textarea>
        </p>
        <p>
            <label for="<?php echo $this->get_field_id('email_list_id'); ?>">Email List ID:</label>
            <input class="widefat" id="<?php echo $this->get_field_id('email_list_id'); ?>" name="<?php echo $this->get_field_name('email_list_id'); ?>" type="text" value="<?php echo esc_attr($email_list_id); ?>">
            <small>Get this from your newsletter admin panel</small>
        </p>
        <?php
    }
    
    public function update($new_instance, $old_instance) {
        $instance = array();
        $instance['title'] = (!empty($new_instance['title'])) ? sanitize_text_field($new_instance['title']) : '';
        $instance['description'] = (!empty($new_instance['description'])) ? sanitize_textarea_field($new_instance['description']) : '';
        $instance['email_list_id'] = (!empty($new_instance['email_list_id'])) ? sanitize_text_field($new_instance['email_list_id']) : '';
        return $instance;
    }
}

// Initialize the plugin
new ArchalleyNewsletterSubscription();
?>
