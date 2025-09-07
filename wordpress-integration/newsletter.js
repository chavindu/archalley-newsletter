jQuery(document).ready(function($) {
    $('.archalley-newsletter-subscribe-form').on('submit', function(e) {
        e.preventDefault();
        
        const form = $(this);
        const emailInput = form.find('input[name="email"]');
        const submitBtn = form.find('.archalley-newsletter-submit-btn');
        const messageDiv = form.find('.archalley-newsletter-message');
        const emailListId = form.data('email-list-id');
        
        const email = emailInput.val().trim();
        
        if (!email) {
            showMessage(messageDiv, 'Please enter your email address.', 'error');
            return;
        }
        
        if (!isValidEmail(email)) {
            showMessage(messageDiv, 'Please enter a valid email address.', 'error');
            return;
        }
        
        // Disable form during submission
        submitBtn.prop('disabled', true).text('Subscribing...');
        messageDiv.removeClass('success error').empty();
        
        // Make API call
        $.ajax({
            url: archalley_ajax.api_url + '/subscribe',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                email: email,
                emailListId: emailListId
            }),
            success: function(response) {
                if (response.status === 'subscribed') {
                    showMessage(messageDiv, 'Thank you for subscribing! You will receive a confirmation email shortly.', 'success');
                    emailInput.val('');
                } else if (response.status === 'already_subscribed') {
                    showMessage(messageDiv, 'You are already subscribed to our newsletter.', 'info');
                } else if (response.status === 'resubscribed') {
                    showMessage(messageDiv, 'Welcome back! You have been resubscribed to our newsletter.', 'success');
                } else {
                    showMessage(messageDiv, response.message || 'Subscription successful!', 'success');
                }
            },
            error: function(xhr) {
                let errorMessage = 'Failed to subscribe. Please try again later.';
                
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    errorMessage = xhr.responseJSON.message;
                }
                
                showMessage(messageDiv, errorMessage, 'error');
            },
            complete: function() {
                submitBtn.prop('disabled', false).text('Subscribe');
            }
        });
    });
    
    function showMessage(element, message, type) {
        element.removeClass('success error info')
               .addClass(type)
               .html(message)
               .fadeIn();
    }
    
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
});
