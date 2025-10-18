/**
 * Voice Chat AI Widget - Professional Embed Script
 * Embeds the chatbot on any website with proper routing and styling
 */

(function() {
  'use strict';
  
  var WIDGET_ID = 'vcai-widget';
  var API_TIMEOUT = 8000;
  
  /**
   * Get configuration from script tag attributes or URL params
   */
  function getConfig() {
    var script = document.currentScript || document.querySelector('script[src*="widget.js"]');
    if (!script) return null;
    
    var src = script.getAttribute('src') || '';
    var url = new URL(src, window.location.href);
    
    return {
      baseUrl: url.origin + url.pathname.replace('/widget.js', ''),
      tenantId: url.searchParams.get('tenantId') || script.getAttribute('data-tenant-id'),
      agentId: url.searchParams.get('agentId') || script.getAttribute('data-agent-id') || null,
      position: url.searchParams.get('position') || script.getAttribute('data-position') || 'bottom-right'
    };
  }
  
  /**
   * Fetch widget configuration from API
   */
  async function fetchWidgetConfig(config) {
    try {
      var apiUrl = config.baseUrl + '/api/public/tenant-config?id=' + encodeURIComponent(config.tenantId);
      if (config.agentId) apiUrl += '&agentId=' + encodeURIComponent(config.agentId);
      apiUrl += '&t=' + Date.now();
      
      var controller = new AbortController();
      var timeoutId = setTimeout(function() { controller.abort(); }, API_TIMEOUT);
      
      var response = await fetch(apiUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: controller.signal,
        cache: 'no-store'
      });
      
      clearTimeout(timeoutId);
      if (!response.ok) throw new Error('API returned ' + response.status);
      
      var data = await response.json();
      return data.tenant || {};
      
    } catch (error) {
      console.warn('[VoiceChat Widget] Failed to fetch config:', error.message);
      return {
        launcherButtonText: 'Chat with us',
        launcherButtonIcon: 'mic',
        launcherButtonSize: 'medium',
        launcherButtonStyle: 'normal',
        launcherButtonAnimation: 'pulse',
        launcherButtonPosition: 'bottom-right',
        brandColor: '#2563eb'
      };
    }
  }
  
  /**
   * Create the professional launcher button
   */
  function createLauncher(widgetConfig, position) {
    var launcher = document.createElement('button');
    launcher.id = WIDGET_ID + '-launcher';
    launcher.setAttribute('aria-label', 'Open Chat Assistant');
    launcher.setAttribute('type', 'button');
    
    var text = widgetConfig.launcherButtonText || 'Chat with us';
    var icon = widgetConfig.launcherButtonIcon || 'mic';
    var size = widgetConfig.launcherButtonSize || 'medium';
    var style = widgetConfig.launcherButtonStyle || 'normal';
    var animation = widgetConfig.launcherButtonAnimation || 'pulse';
    var brandColor = widgetConfig.brandColor || '#2563eb';
    
    // Size configurations
    var sizes = {
      small: { circle: 52, pill: 48, fontSize: 14, padding: '0 16px 0 10px', iconSize: 20 },
      medium: { circle: 60, pill: 56, fontSize: 15, padding: '0 20px 0 12px', iconSize: 24 },
      large: { circle: 68, pill: 64, fontSize: 16, padding: '0 24px 0 14px', iconSize: 28 }
    };
    var sizeConfig = sizes[size] || sizes.medium;
    
    var fontWeight = style === 'light' ? '500' : style === 'bold' ? '700' : '600';
    var hasText = text && text.trim();
    var isCircle = !hasText;
    
    // Responsive margin
    var vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    var margin = vw < 480 ? '10px' : '20px';
    
    // Professional gradient background
    launcher.style.cssText = [
      'position: fixed',
      'z-index: 2147483000',
      'border: none',
      'cursor: pointer',
      'outline: none',
      'user-select: none',
      'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", sans-serif',
      'font-weight: ' + fontWeight,
      'font-size: ' + sizeConfig.fontSize + 'px',
      'color: white',
      'background: linear-gradient(135deg, ' + brandColor + ' 0%, ' + adjustBrightness(brandColor, -15) + ' 100%)',
      'box-shadow: 0 8px 24px rgba(0,0,0,0.15), 0 4px 8px rgba(0,0,0,0.10)',
      'transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      'display: flex',
      'align-items: center',
      'justify-content: center',
      'gap: 8px',
      'margin: ' + margin,
      'backdrop-filter: blur(10px)'
    ].join('; ');
    
    // Position the button
    if (position.includes('bottom')) launcher.style.bottom = '0';
    if (position.includes('top')) launcher.style.top = '0';
    if (position.includes('right')) launcher.style.right = '0';
    if (position.includes('left')) launcher.style.left = '0';
    
    // Shape: circle or pill
    if (isCircle) {
      launcher.style.width = sizeConfig.circle + 'px';
      launcher.style.height = sizeConfig.circle + 'px';
      launcher.style.borderRadius = '50%';
      launcher.style.padding = '0';
    } else {
      launcher.style.height = sizeConfig.pill + 'px';
      launcher.style.borderRadius = (sizeConfig.pill / 2) + 'px';
      launcher.style.padding = sizeConfig.padding;
      launcher.style.minWidth = '120px';
      launcher.style.maxWidth = '240px';
    }
    
    // Icon SVGs
    var icons = {
      mic: '<svg width="' + sizeConfig.iconSize + '" height="' + sizeConfig.iconSize + '" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>',
      chat: '<svg width="' + sizeConfig.iconSize + '" height="' + sizeConfig.iconSize + '" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>',
      help: '<svg width="' + sizeConfig.iconSize + '" height="' + sizeConfig.iconSize + '" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
      phone: '<svg width="' + sizeConfig.iconSize + '" height="' + sizeConfig.iconSize + '" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>'
    };
    
    var iconSvg = icons[icon] || icons.mic;
    var content = '<div style="display: flex; align-items: center; justify-content: center; gap: 8px;">' + iconSvg;
    if (hasText) {
      content += '<span style="white-space: nowrap; text-shadow: 0 1px 2px rgba(0,0,0,0.2);">' + escapeHtml(text) + '</span>';
    }
    content += '</div>';
    launcher.innerHTML = content;
    
    // Hover effects
    launcher.addEventListener('mouseenter', function() {
      launcher.style.transform = 'translateY(-3px) scale(1.05)';
      launcher.style.boxShadow = '0 12px 32px rgba(0,0,0,0.20), 0 6px 12px rgba(0,0,0,0.15)';
    });
    
    launcher.addEventListener('mouseleave', function() {
      launcher.style.transform = 'translateY(0) scale(1)';
      launcher.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15), 0 4px 8px rgba(0,0,0,0.10)';
    });
    
    launcher.addEventListener('focus', function() {
      launcher.style.outline = '3px solid rgba(59, 130, 246, 0.5)';
      launcher.style.outlineOffset = '2px';
    });
    
    launcher.addEventListener('blur', function() {
      launcher.style.outline = 'none';
    });
    
    // Add animations
    addAnimations(launcher, animation);
    
    return launcher;
  }
  
  /**
   * Add CSS animations
   */
  function addAnimations(launcher, animation) {
    var styleEl = document.getElementById('vcai-animations');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'vcai-animations';
      styleEl.textContent = `
        @keyframes vcai-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes vcai-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes vcai-glow {
          0%, 100% { box-shadow: 0 8px 24px rgba(0,0,0,0.15), 0 4px 8px rgba(0,0,0,0.10); }
          50% { box-shadow: 0 12px 40px rgba(37,99,235,0.4), 0 6px 16px rgba(37,99,235,0.2); }
        }
      `;
      document.head.appendChild(styleEl);
    }
    
    var animationMap = {
      pulse: 'vcai-pulse 2s ease-in-out infinite',
      bounce: 'vcai-bounce 2s ease-in-out infinite',
      glow: 'vcai-glow 2s ease-in-out infinite',
      none: 'none'
    };
    
    launcher.style.animation = animationMap[animation] || animationMap.pulse;
    launcher.setAttribute('data-animation', animation);
  }
  
  /**
   * Create the chat iframe with proper routing (EXACT same as original)
   */
  function createChatIframe(config) {
    var iframe = document.createElement('iframe');
    iframe.id = WIDGET_ID + '-iframe';
    
    // EXACT same routing as original widget.js
    iframe.src = config.baseUrl + '/?tenantId=' + encodeURIComponent(config.tenantId) + 
                 (config.agentId ? '&agentId=' + encodeURIComponent(config.agentId) : '') + 
                 '&embed=1#vcai-embed';
    
    iframe.title = 'Chat Assistant';
    iframe.allow = 'microphone; clipboard-write';
    
    iframe.style.cssText = [
      'position: fixed',
      'z-index: 2147483001',
      'border: none',
      'border-radius: 24px',
      'box-shadow: 0 20px 60px rgba(0,0,0,0.15), 0 8px 20px rgba(0,0,0,0.10)',
      'background: white',
      'opacity: 0',
      'pointer-events: none',
      'transform: scale(0.95) translateY(20px)',
      'transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      'max-width: calc(100vw - 40px)',
      'max-height: calc(100vh - 40px)'
    ].join('; ');
    
    return iframe;
  }

  /**
   * Helper: Adjust color brightness
   */
  function adjustBrightness(hex, percent) {
    var num = parseInt(hex.replace('#', ''), 16);
    var amt = Math.round(2.55 * percent);
    var R = (num >> 16) + amt;
    var G = (num >> 8 & 0x00FF) + amt;
    var B = (num & 0x0000FF) + amt;
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255))
      .toString(16).slice(1);
  }

  /**
   * Helper: Escape HTML
   */
  function escapeHtml(text) {
    var map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
  }

  /**
   * Initialize the widget
   */
  async function initWidget() {
    if (document.getElementById(WIDGET_ID + '-launcher')) {
      console.warn('[VoiceChat Widget] Already initialized');
      return;
    }
    
    var config = getConfig();
    if (!config || !config.tenantId) {
      console.error('[VoiceChat Widget] Missing tenantId in widget.js URL or data-tenant-id attribute');
      return;
    }
    
    console.log('[VoiceChat Widget] Initializing with config:', config);
    
    var widgetConfig = await fetchWidgetConfig(config);
    console.log('[VoiceChat Widget] Loaded configuration:', widgetConfig);
    
    var position = widgetConfig.launcherButtonPosition || config.position;
    var autoOpenDelay = widgetConfig.launcherAutoOpenDelay || 'none';
    
    var launcher = createLauncher(widgetConfig, position);
    document.body.appendChild(launcher);
    
    var iframe = createChatIframe(config);
    document.body.appendChild(iframe);
    
    var isOpen = false;
    var autoOpenTimer = null;
    
    // Open chat when launcher is clicked
    launcher.addEventListener('click', function() {
      if (!isOpen) {
        openChat();
      }
    });
    
    function openChat() {
      if (isOpen) return;
      
      isOpen = true;
      
      // Hide launcher with smooth transition
      launcher.style.opacity = '0';
      launcher.style.transform = 'scale(0.8)';
      launcher.style.pointerEvents = 'none';
      
      // Show iframe
      var vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
      var vh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
      var isMobile = vw < 768;
      
      // Reset iframe positioning
      iframe.style.top = '';
      iframe.style.bottom = '';
      iframe.style.left = '';
      iframe.style.right = '';
      
      if (isMobile) {
        // Mobile: responsive sizing
        iframe.style.width = 'calc(100vw - 20px)';
        iframe.style.height = 'calc(100vh - 100px)';
        iframe.style.bottom = '10px';
        iframe.style.left = '10px';
      } else {
        // Desktop: fixed size with position
        iframe.style.width = '440px';
        iframe.style.height = '680px';
        
        if (position.includes('bottom')) iframe.style.bottom = '20px';
        if (position.includes('top')) iframe.style.top = '20px';
        if (position.includes('right')) iframe.style.right = '20px';
        if (position.includes('left')) iframe.style.left = '20px';
      }
      
      iframe.style.opacity = '1';
      iframe.style.transform = 'scale(1) translateY(0)';
      iframe.style.pointerEvents = 'auto';
      
      // Notify iframe
      setTimeout(function() {
        if (iframe.contentWindow) {
          iframe.contentWindow.postMessage({ source: 'vcai-host', open: true }, '*');
        }
      }, 100);
    }
    
    function closeChat() {
      if (!isOpen) return;
      
      isOpen = false;
      
      // Hide iframe
      iframe.style.opacity = '0';
      iframe.style.transform = 'scale(0.95) translateY(20px)';
      iframe.style.pointerEvents = 'none';
      
      // Show launcher
      setTimeout(function() {
        launcher.style.opacity = '1';
        launcher.style.transform = 'scale(1)';
        launcher.style.pointerEvents = 'auto';
      }, 200);
    }
    
    // Listen for close message from iframe
    window.addEventListener('message', function(event) {
      if (event.data && event.data.source === 'vcai-widget') {
        if (event.data.open === false) {
          closeChat();
        }
      }
    });
    
    // Handle window resize
    var resizeTimeout;
    window.addEventListener('resize', function() {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(function() {
        if (isOpen) {
          var vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
          var vh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
          var isMobile = vw < 768;
          
          iframe.style.top = '';
          iframe.style.bottom = '';
          iframe.style.left = '';
          iframe.style.right = '';
          
          if (isMobile) {
            iframe.style.width = 'calc(100vw - 20px)';
            iframe.style.height = 'calc(100vh - 100px)';
            iframe.style.bottom = '10px';
            iframe.style.left = '10px';
          } else {
            iframe.style.width = '440px';
            iframe.style.height = '680px';
            
            if (position.includes('bottom')) iframe.style.bottom = '20px';
            if (position.includes('top')) iframe.style.top = '20px';
            if (position.includes('right')) iframe.style.right = '20px';
            if (position.includes('left')) iframe.style.left = '20px';
          }
        }
      }, 150);
    });
    
    // Auto-open functionality
    if (autoOpenDelay !== 'none' && !isNaN(parseInt(autoOpenDelay))) {
      var delayMs = parseInt(autoOpenDelay) * 1000;
      autoOpenTimer = setTimeout(function() {
        if (!isOpen) {
          console.log('[VoiceChat Widget] Auto-opening after ' + autoOpenDelay + ' seconds');
          openChat();
        }
      }, delayMs);
      
      // Clear timer on user interaction
      var clearAutoOpen = function() {
        if (autoOpenTimer) {
          clearTimeout(autoOpenTimer);
          autoOpenTimer = null;
        }
      };
      
      document.addEventListener('click', clearAutoOpen, { once: true });
      document.addEventListener('scroll', clearAutoOpen, { once: true });
      document.addEventListener('keydown', clearAutoOpen, { once: true });
      document.addEventListener('touchstart', clearAutoOpen, { once: true });
    }
    
    console.log('[VoiceChat Widget] Initialized successfully');
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWidget);
  } else {
    initWidget();
  }
  
})();