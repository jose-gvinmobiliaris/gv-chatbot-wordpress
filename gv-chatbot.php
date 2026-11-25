<?php
/**
 * Plugin Name: GV Chatbot
 * Description: Widget de atención comercial de GV Inmobiliaria.
 * Version: 1.0.0
 * Author: GV Inmobiliaria
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * URL base de la API Laravel en producción.
 * Reemplazar por la URL real donde desplegaste Laravel.
 */
define('GV_CHATBOT_API_URL', 'https://api.gyvinmobiliaria.com/api/chat');


/**
 * Cargar CSS y JavaScript del chatbot.
 */

function gv_chatbot_enqueue_assets() {

    $css_path = plugin_dir_path(__FILE__) . 'assets/css/styles.css';
    $api_path = plugin_dir_path(__FILE__) . 'assets/js/api.js';
    $app_path = plugin_dir_path(__FILE__) . 'assets/js/app.js';

    wp_enqueue_style(
        'gv-chatbot-styles',
        plugin_dir_url(__FILE__) . 'assets/css/styles.css',
        array(),
        file_exists($css_path) ? filemtime($css_path) : '1.0.1'
    );

    wp_enqueue_script(
        'gv-chatbot-api',
        plugin_dir_url(__FILE__) . 'assets/js/api.js',
        array(),
        file_exists($api_path) ? filemtime($api_path) : '1.0.1',
        true
    );

    wp_localize_script(
        'gv-chatbot-api',
        'GV_CHATBOT_CONFIG',
        array(
            'apiBaseUrl' => GV_CHATBOT_API_URL
        )
    );

    wp_enqueue_script(
        'gv-chatbot-app',
        plugin_dir_url(__FILE__) . 'assets/js/app.js',
        array('gv-chatbot-api'),
        file_exists($app_path) ? filemtime($app_path) : '1.0.1',
        true
    );
}
add_action('wp_enqueue_scripts', 'gv_chatbot_enqueue_assets');



/**
 * Insertar el HTML del chatbot antes del cierre de body.
 */
function gv_chatbot_render_widget() {
    ?>

    <div id="gv-chatbot-widget">

        <button
            class="chat-toggle"
            id="chatToggle"
            aria-label="Abrir chat"
            aria-expanded="false"
        >
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8A8.5 8.5 0 0 1 8.7 3.9a8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z"/>
            </svg>
            <span class="chat-notification"></span>
        </button>

        <section
            class="chat-window"
            id="chatWindow"
            aria-label="Chat GV"
            aria-hidden="true"
        >

            <header class="chat-header">

                <div class="chat-brand">
                    <div class="brand-logo">GV</div>

                    <div>
                        <h2>GV Inmobiliaria</h2>

                        <span class="online-status">
                            <span></span> En línea
                        </span>
                    </div>
                </div>

                <div class="header-actions">
                    <button id="minimizeChat" aria-label="Minimizar chat">−</button>
                    <button id="closeChat" aria-label="Cerrar chat">×</button>
                </div>

            </header>

            <div class="chat-welcome">
                <span class="welcome-icon">GV</span>
                <h3>¡Hola! Bienvenido</h3>
                <p>Soy el asistente virtual de GV</p>
            </div>

            <div
                class="chat-messages"
                id="chatMessages"
                aria-live="polite"
            ></div>

            <div class="chat-options" id="chatOptions"></div>

            <footer class="chat-footer">
                Atención comercial · GV Inmobiliaria
            </footer>

        </section>

    </div>

    <?php
}
add_action('wp_footer', 'gv_chatbot_render_widget');
