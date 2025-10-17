(function() {
  'use strict';
  
  var WIDGET_ID = 'vcai-widget';
  var API_TIMEOUT = 8000;
  
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
  
  async function fetchWidgetConfig(config) {
    try {
      var apiUrl = config.baseUrl + '/api/public/tenant-config?id=' + encodeURIComponent(config.tenantId);
      if (config.agentId) apiUrl += '&agentId=' + encodeURIComponent(config.agentId);
      apiUrl += '&t=' + Date.now();
      
      var controller = new AbortController();
      var timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);
      
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
        launcherButtonText: '',
        launcherButtonIcon: 'mic',
        launcherButtonSize: 'medium',
        launcherButtonStyle: 'normal',
        launcherButtonAnimation: 'pulse',
        launcherButtonPosition: 'bottom-right',
        brandColor: '#2563eb'
      };
    }
  }
  
  function createLauncher(widgetConfig, position) {
    var launcher = document.createElement('button');
    launcher.id = WIDGET_ID + '-launcher';
    launcher.setAttribute('aria-label', 'Open Chat Assistant');
    launcher.setAttribute('type', 'button');
    
    var text = widgetConfig.launcherButtonText || '';
    var icon = widgetConfig.launcherButtonIcon || 'mic';
    var size = widgetConfig.launcherButtonSize || 'medium';
    var style = widgetConfig.launcherButtonStyle || 'normal';
    var animation = widgetConfig.launcherButtonAnimation || 'pulse';
    var brandColor = widgetConfig.brandColor || '#2563eb';
    
    var sizes = {
      small: { circle: 52, pill: 48, fontSize: 14, padding: '0 16px 0 10px', iconSize: 20 },
      medium: { circle: 60, pill: 56, fontSize: 15, padding: '0 20px 0 12px', iconSize: 24 },
      large: { circle: 68, pill: 64, fontSize: 16, padding: '0 24px 0 14px', iconSize: 28 }
    };
    var sizeConfig = sizes[size] || sizes.medium;
    
    var fontWeight = style === 'light' ? '500' : style === 'bold' ? '700' : '600';
    var hasText = text && text.trim();
    var isCircle = !hasText;
    
    // Responsive margin based on screen size
    var vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    var margin = vw < 480 ? '10px' : '20px';
    
    // Professional solid background with brand color
    launcher.style.cssText = [
      'position: fixed',
      'z-index: 2147483000',
      'border: none',
      'cursor: pointer',
      'outline: none',
      'user-select: none',
      'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      'font-weight: ' + fontWeight,
      'font-size: ' + sizeConfig.fontSize + 'px',
      'color: white',
      'background: ' + brandColor,
      'box-shadow: 0 4px 12px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.1)',
      'transition: all 0.2s ease-in-out',
      'display: flex',
      'align-items: center',
      'justify-content: center',
      'gap: 8px',
      'margin: ' + margin
    ].join('; ');
    
    if (position.includes('bottom')) launcher.style.bottom = '0';
    if (position.includes('top')) launcher.style.top = '0';
    if (position.includes('right')) launcher.style.right = '0';
    if (position.includes('left')) launcher.style.left = '0';
    
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
    
    var icons = {
      mic: '<svg width="' + sizeConfig.iconSize + '" height="' + sizeConfig.iconSize + '" viewBox="0 0 24 24" fill="none"><path d="M12 1a4 4 0 0 0-4 4v6a4 4 0 0 0 8 0V5a4 4 0 0 0-4-4z" fill="white"/><path d="M19 10v1a7 7 0 0 1-14 0v-1" stroke="white" stroke-width="2" stroke-linecap="round"/><path d="M12 18v4" stroke="white" stroke-width="2" stroke-linecap="round"/><path d="M8 22h8" stroke="white" stroke-width="2" stroke-linecap="round"/></svg>',
      chat: '<svg width="' + sizeConfig.iconSize + '" height="' + sizeConfig.iconSize + '" viewBox="0 0 24 24" fill="none"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" fill="white"/></svg>',
      help: '<svg width="' + sizeConfig.iconSize + '" height="' + sizeConfig.iconSize + '" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="white" stroke-width="2"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="17" r="1" fill="white"/></svg>',
      phone: '<svg width="' + sizeConfig.iconSize + '" height="' + sizeConfig.iconSize + '" viewBox="0 0 24 24" fill="none"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" fill="white"/></svg>'
    };
    
    var iconSvg = icons[icon] || icons.mic;
    var content = iconSvg;
    if (hasText) {
      content += '<span style="white-space: nowrap; text-shadow: 0 1px 2px rgba(0,0,0,0.2);">' + text + '</span>';
    }
    launcher.innerHTML = content;
    
    launcher.addEventListener('mouseenter', function() {
      launcher.style.transform = 'translateY(-1px)';
      launcher.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2), 0 3px 6px rgba(0,0,0,0.15)';
    });
    
    launcher.addEventListener('mouseleave', function() {
      launcher.style.transform = '';
      launcher.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.1)';
    });
    
    // Professional subtle animations only
    var styleEl = document.getElementById('vcai-animations');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'vcai-animations';
      document.head.appendChild(styleEl);
    }
    
    // Only add subtle breathing animation for professional look
    var breathingKeyframes = '@keyframes vcai-breathe { ' +
      '0%, 100% { transform: scale(1); } ' +
      '50% { transform: scale(1.02); } ' +
    '}';
    
    styleEl.textContent = breathingKeyframes;
    
    // Apply subtle animation only if not set to 'none'
    var animationStyle = '';
    if (animation === 'none') {
      animationStyle = 'none';
    } else {
      // Subtle breathing animation for professional appearance
      animationStyle = 'vcai-breathe 3s ease-in-out infinite';
    }
    
    launcher.style.animation = animationStyle;
    launcher.setAttribute('data-animation', animation || 'breathe');
    
    return launcher;
  }
  
  function createChatIframe(config) {
    var iframe = document.createElement('iframe');
    iframe.id = WIDGET_ID + '-iframe';
    iframe.src = config.baseUrl + '/?tenantId=' + encodeURIComponent(config.tenantId) + 
                 (config.agentId ? '&agentId=' + encodeURIComponent(config.agentId) : '') + 
                 '&embed=1#vcai-embed';
    iframe.title = 'Chat Assistant';
    iframe.allow = 'microphone; clipboard-write';
    
    iframe.style.cssText = [
      'position: fixed',
      'z-index: 2147483001',
      'border: 1px solid rgba(0,0,0,0.1)',
      'border-radius: 12px',
      'box-shadow: 0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)',
      'background: white',
      'opacity: 0',
      'pointer-events: none',
      'transition: all 0.3s ease-in-out',
      'margin: 20px',
      'max-width: calc(100vw - 20px)',
      'max-height: calc(100vh - 40px)'
    ].join('; ');
    
    return iframe;
  }

  function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  async function initWidget() {
    if (document.getElementById(WIDGET_ID + '-launcher')) return;
    
    var config = getConfig();
    if (!config || !config.tenantId) {
      console.error('[VoiceChat Widget] Missing tenantId in widget.js URL');
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
    
    launcher.addEventListener('click', function() {
      if (!isOpen) {
        isOpen = true;
        // Completely remove ALL animations and hide launcher when chat opens
        launcher.style.animation = 'none';
        launcher.style.transform = 'none';
        launcher.style.transition = 'none';
        launcher.style.backgroundPosition = '0% 50%'; // Stop gradient shift
        launcher.style.display = 'none'; // Completely hide launcher
        launcher.style.visibility = 'hidden';
        launcher.style.pointerEvents = 'none';
        
        var vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
        var vh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
        var isMobile = vw < 768;
        var isSmallMobile = vw < 480;
        
        // Reset positioning
        iframe.style.top = '';
        iframe.style.bottom = '';
        iframe.style.left = '';
        iframe.style.right = '';
        iframe.style.margin = '';
        
        if (isMobile) {
          // Mobile: Full screen with small margins
          if (isSmallMobile) {
            iframe.style.width = (vw - 20) + 'px';
            iframe.style.height = (vh - 40) + 'px';
            iframe.style.margin = '10px';
            iframe.style.top = '0';
            iframe.style.left = '0';
          } else {
            iframe.style.width = Math.min(vw - 40, 380) + 'px';
            iframe.style.height = Math.min(vh - 80, 580) + 'px';
            iframe.style.margin = '20px';
            if (position.includes('bottom')) iframe.style.bottom = '0';
            if (position.includes('top')) iframe.style.top = '0';
            if (position.includes('right')) iframe.style.right = '0';
            if (position.includes('left')) iframe.style.left = '0';
          }
        } else {
          // Desktop: Fixed size with position
          iframe.style.width = '420px';
          iframe.style.height = '640px';
          iframe.style.margin = '20px';
          if (position.includes('bottom')) iframe.style.bottom = '0';
          if (position.includes('top')) iframe.style.top = '0';
          if (position.includes('right')) iframe.style.right = '0';
          if (position.includes('left')) iframe.style.left = '0';
        }
        
        iframe.style.opacity = '1';
        iframe.style.pointerEvents = 'auto';
        
        setTimeout(function() {
          if (iframe.contentWindow) {
            iframe.contentWindow.postMessage({ source: 'vcai-host', open: true }, '*');
          }
        }, 100);
      }
    });
    
    window.addEventListener('message', function(event) {
      if (event.data && event.data.source === 'vcai-widget') {
        if (event.data.open === false) {
          isOpen = false;
          iframe.style.opacity = '0';
          iframe.style.pointerEvents = 'none';
          
          // Restore launcher visibility and animations when chat closes
          launcher.style.display = '';
          launcher.style.visibility = 'visible';
          launcher.style.pointerEvents = 'auto';
          launcher.style.transition = 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
          
          // Restore professional animations
          var savedAnimation = launcher.getAttribute('data-animation') || 'breathe';
          var animationStyle = '';
          if (savedAnimation === 'none') {
            animationStyle = 'none';
          } else {
            animationStyle = 'vcai-breathe 3s ease-in-out infinite';
          }
          launcher.style.animation = animationStyle;
        }
      }
    });
    
    var resizeTimeout;
    window.addEventListener('resize', function() {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(function() {
        if (isOpen) {
          var vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
          var vh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
          var isMobile = vw < 768;
          var isSmallMobile = vw < 480;
          
          // Reset positioning
          iframe.style.top = '';
          iframe.style.bottom = '';
          iframe.style.left = '';
          iframe.style.right = '';
          iframe.style.margin = '';
          
          if (isMobile) {
            if (isSmallMobile) {
              iframe.style.width = (vw - 20) + 'px';
              iframe.style.height = (vh - 40) + 'px';
              iframe.style.margin = '10px';
              iframe.style.top = '0';
              iframe.style.left = '0';
            } else {
              iframe.style.width = Math.min(vw - 40, 380) + 'px';
              iframe.style.height = Math.min(vh - 80, 580) + 'px';
              iframe.style.margin = '20px';
              if (position.includes('bottom')) iframe.style.bottom = '0';
              if (position.includes('top')) iframe.style.top = '0';
              if (position.includes('right')) iframe.style.right = '0';
              if (position.includes('left')) iframe.style.left = '0';
            }
          } else {
            iframe.style.width = '420px';
            iframe.style.height = '640px';
            iframe.style.margin = '20px';
            if (position.includes('bottom')) iframe.style.bottom = '0';
            if (position.includes('top')) iframe.style.top = '0';
            if (position.includes('right')) iframe.style.right = '0';
            if (position.includes('left')) iframe.style.left = '0';
          }
        }
      }, 150);
    });
    
    // Setup auto-open functionality
    if (autoOpenDelay !== 'none' && !isNaN(parseInt(autoOpenDelay))) {
      var delayMs = parseInt(autoOpenDelay) * 1000;
      autoOpenTimer = setTimeout(function() {
        if (!isOpen) {
          console.log('[VoiceChat Widget] Auto-opening after ' + autoOpenDelay + ' seconds');
          launcher.click();
        }
      }, delayMs);
      
      // Clear timer if user interacts with page
      var clearAutoOpen = function() {
        if (autoOpenTimer) {
          clearTimeout(autoOpenTimer);
          autoOpenTimer = null;
        }
      };
      
      // Clear on any user interaction
      document.addEventListener('click', clearAutoOpen, { once: true });
      document.addEventListener('scroll', clearAutoOpen, { once: true });
      document.addEventListener('keydown', clearAutoOpen, { once: true });
      document.addEventListener('touchstart', clearAutoOpen, { once: true });
    }
    
    console.log('[VoiceChat Widget] Initialized successfully');
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWidget);
  } else {
    initWidget();
  }
  
})();
