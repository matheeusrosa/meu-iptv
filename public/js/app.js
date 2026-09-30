/**
 * IPTV Pro Brasil - Main Application Controller
 * Coordena os módulos ChannelManager, StreamPlayer e UIManager com Telemetria Integrada.
 */

(function () {
  'use strict';

  let channelManager = null;
  let streamPlayer = null;
  let ui = null;
  let currentAspectRatioIndex = 0;
  let digitBuffer = '';
  let digitTimeout = null;

  // Coleção segura de referências DOM
  const dom = {
    video: document.getElementById('video-element'),
    playerViewport: document.getElementById('player-viewport'),
    sidebar: document.getElementById('sidebar'),
    channelList: document.getElementById('channel-list'),
    categoryPills: document.getElementById('category-pills'),
    searchInput: document.getElementById('search-input'),
    btnClearSearch: document.getElementById('btn-clear-search'),
    channelsCount: document.getElementById('channels-count'),
    currentCategoryName: document.getElementById('current-category-name'),
    channelsBadgeTop: document.getElementById('channels-badge-top'),

    // OSD
    osdTitle: document.getElementById('osd-title'),
    osdCategory: document.getElementById('osd-category'),
    osdLogo: document.getElementById('osd-logo'),
    osdAvatarFallback: document.getElementById('osd-avatar-fallback'),
    osdToast: document.getElementById('osd-toast'),
    statusOverlay: document.getElementById('status-overlay'),
    statusLabel: document.getElementById('status-label'),
    errorCard: document.getElementById('error-card'),
    errorMessage: document.getElementById('error-message'),
    channelStepperNumber: document.getElementById('channel-stepper-number'),

    // Controles
    btnPlayPause: document.getElementById('btn-play-pause'),
    iconPlay: document.getElementById('icon-play'),
    iconPause: document.getElementById('icon-pause'),
    btnPrevChannel: document.getElementById('btn-prev-channel'),
    btnNextChannel: document.getElementById('btn-next-channel'),
    btnMute: document.getElementById('btn-mute'),
    iconVolHigh: document.getElementById('icon-vol-high'),
    iconVolMute: document.getElementById('icon-vol-mute'),
    volumeRange: document.getElementById('volume-range'),
    btnReloadStream: document.getElementById('btn-reload-stream'),
    btnAspectRatio: document.getElementById('btn-aspect-ratio'),
    btnPip: document.getElementById('btn-pip'),
    btnFullscreen: document.getElementById('btn-fullscreen'),
    iconFsEnter: document.getElementById('icon-fs-enter'),
    iconFsExit: document.getElementById('icon-fs-exit'),
    btnToggleSidebar: document.getElementById('btn-toggle-sidebar'),
    btnToggleSidebarTop: document.getElementById('btn-toggle-sidebar-top'),
    btnCloseSidebar: document.getElementById('btn-close-sidebar'),
    btnRetryStream: document.getElementById('btn-retry-stream'),
    btnTryBackup: document.getElementById('btn-try-backup'),

    // Controles DVR Ao Vivo
    dvrTimelineContainer: document.getElementById('dvr-timeline-container'),
    dvrTimelineTrack: document.getElementById('dvr-timeline-track'),
    dvrBufferBar: document.getElementById('dvr-buffer-bar'),
    dvrPlayedBar: document.getElementById('dvr-played-bar'),
    dvrPlayhead: document.getElementById('dvr-playhead'),
    dvrHoverTooltip: document.getElementById('dvr-hover-tooltip'),
    btnRewind10: document.getElementById('btn-rewind-10'),
    btnForward10: document.getElementById('btn-forward-10'),
    btnLiveIndicator: document.getElementById('btn-live-indicator'),
    liveBadgeText: document.getElementById('live-badge-text'),
    osdLivePillTop: document.getElementById('osd-live-pill-top'),
    osdLivePillText: document.getElementById('osd-live-pill-text'),

    // Modais
    shortcutsModal: document.getElementById('shortcuts-modal'),
    btnShortcuts: document.getElementById('btn-shortcuts'),
    btnCloseShortcuts: document.getElementById('btn-close-shortcuts'),
    mobileModal: document.getElementById('mobile-modal'),
    btnOpenMobileModal: document.getElementById('btn-open-mobile-modal'),
    btnCloseMobileModal: document.getElementById('btn-close-mobile-modal'),
    mobileLinkText: document.getElementById('mobile-link-text'),
    qrCodeImg: document.getElementById('qr-code-img')
  };

  // Captura global de exceções para telemetria com filtro de ruído
  window.addEventListener('error', (e) => {
    // Ignora "Script error." sem arquivo (mascarado por extensões ou CORS de terceiros)
    if (!e.filename && (!e.message || e.message === 'Script error.')) {
      return;
    }
    // Ignora extensões de navegadores instaladas pelo usuário
    if (e.filename && (e.filename.startsWith('chrome-extension:') || e.filename.startsWith('moz-extension:'))) {
      return;
    }
    if (streamPlayer) {
      streamPlayer.reportTelemetry('WINDOW_JS_ERROR', {
        message: e.message || 'Erro Desconhecido',
        filename: e.filename || '',
        lineno: e.lineno || 0,
        colno: e.colno || 0
      });
    }
  });

  window.addEventListener('unhandledrejection', (e) => {
    const reasonMsg = e.reason ? (e.reason.message || String(e.reason)) : '';
    // Ignora rejeições de autoplay interrompido ou abort intencional na troca rápida de canal
    if (reasonMsg.includes('AbortError') || reasonMsg.includes('interrupted') || reasonMsg.includes('play()')) {
      return;
    }
    if (streamPlayer) {
      streamPlayer.reportTelemetry('UNHANDLED_REJECTION', {
        reason: reasonMsg || 'Desconhecido'
      });
    }
  });

  async function init() {
    ui = new UIManager(dom);

    // 1. Inicializa com a base de canais embutida (zero latência)
    const initialChannels = window.DEFAULT_CHANNELS_DATA || [];
    channelManager = new ChannelManager(initialChannels);

    // 2. Inicializa o Player
    streamPlayer = new StreamPlayer(dom.video, {
      onStatus: (msg) => ui.showStatus(msg),
      onError: (msg) => ui.showError(msg),
      onPlaying: () => {
        ui.hideStatus();
        ui.hideError();
        ui.resetIdleTimer(true);
      },
      onPlay: () => {
        ui.updatePlayState(true);
        ui.resetIdleTimer(true);
      },
      onPause: () => {
        ui.updatePlayState(false);
        ui.resetIdleTimer(false);
      },
      onVolumeChange: (vol, muted) => {
        ui.updateVolume(vol, muted);
        localStorage.setItem(IPTV_CONFIG.storageKeys.volume, vol.toString());
      },
      onTimeUpdate: (dvrState) => {
        ui.updateDVR(dvrState);
      }
    });

    // 3. Renderiza imediatamente a interface
    renderUI();
    bindEvents();
    restoreVolume();

    // 4. Inicia reprodução do primeiro canal
    if (channelManager.filteredChannels.length > 0) {
      playChannelByIndex(0);
    }

    // 5. Se estiver em HTTP(S), sincroniza com a API REST em segundo plano
    if (window.location.protocol.startsWith('http')) {
      syncWithAPI();
    }
  }

  function renderUI() {
    ui.renderChannelList(
      channelManager.filteredChannels,
      channelManager.currentIndex,
      channelManager.favorites,
      (index) => playChannelByIndex(index),
      (name) => toggleFavorite(name)
    );

    if (dom.channelsBadgeTop) {
      dom.channelsBadgeTop.textContent = `${channelManager.allChannels.length} CANAIS ONLINE`;
    }
  }

  async function syncWithAPI() {
    try {
      const res = await fetch(IPTV_CONFIG.apiEndpoint);
      if (res.ok) {
        const data = await res.json();
        if (data.channels && data.channels.length > 0) {
          channelManager.setChannels(data.channels);
          renderUI();
        }
      }
    } catch (e) {
      console.log('[App] Utilizando base de canais embutida.');
    }
  }

  function playChannelByIndex(index) {
    if (!channelManager.setCurrentIndex(index)) return;

    const channel = channelManager.getCurrentChannel();
    if (!channel) return;

    ui.updateOSD(channel, index);
    streamPlayer.loadStream(channel);
  }

  function toggleFavorite(name) {
    const added = channelManager.toggleFavorite(name);
    ui.showToast(added ? 'Adicionado aos Favoritos ⭐' : 'Removido dos Favoritos');
    renderUI();
  }

  function cycleAspectRatio() {
    currentAspectRatioIndex = (currentAspectRatioIndex + 1) % IPTV_CONFIG.aspectRatios.length;
    const label = streamPlayer.setAspectRatio(currentAspectRatioIndex);
    ui.showToast('Proporção: ' + label);
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      dom.playerViewport.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }

  function togglePiP() {
    if (document.pictureInPictureElement) {
      document.exitPictureInPicture().catch(() => {});
    } else if (document.pictureInPictureEnabled) {
      dom.video.requestPictureInPicture().catch(() => {});
    }
  }

  function restoreVolume() {
    const saved = localStorage.getItem(IPTV_CONFIG.storageKeys.volume);
    const vol = (saved !== null) ? parseFloat(saved) : IPTV_CONFIG.defaultVolume;
    streamPlayer.setVolume(!isNaN(vol) ? vol : 0.9);
  }

  function handleDigitKey(digit) {
    digitBuffer += digit;
    ui.showToast('Canal: ' + digitBuffer);
    clearTimeout(digitTimeout);
    digitTimeout = setTimeout(() => {
      const num = parseInt(digitBuffer, 10);
      digitBuffer = '';
      if (num >= 1 && num <= channelManager.filteredChannels.length) {
        playChannelByIndex(num - 1);
      } else {
        ui.showToast(`Canal ${num} não encontrado`);
      }
    }, 1200);
  }

  function bindEvents() {
    if (dom.btnPlayPause) dom.btnPlayPause.addEventListener('click', () => streamPlayer.togglePlay());
    if (dom.btnPrevChannel) dom.btnPrevChannel.addEventListener('click', () => playChannelByIndex(channelManager.getPrevIndex()));
    if (dom.btnNextChannel) dom.btnNextChannel.addEventListener('click', () => playChannelByIndex(channelManager.getNextIndex()));
    if (dom.btnMute) dom.btnMute.addEventListener('click', () => streamPlayer.toggleMute());
    if (dom.volumeRange) dom.volumeRange.addEventListener('input', (e) => streamPlayer.setVolume(parseFloat(e.target.value)));

    if (dom.btnReloadStream) {
      dom.btnReloadStream.addEventListener('click', () => {
        ui.showToast('Recarregando canal...');
        playChannelByIndex(channelManager.currentIndex);
      });
    }

    if (dom.btnAspectRatio) dom.btnAspectRatio.addEventListener('click', cycleAspectRatio);
    if (dom.btnPip) dom.btnPip.addEventListener('click', togglePiP);
    if (dom.btnFullscreen) dom.btnFullscreen.addEventListener('click', toggleFullscreen);

    // Controles DVR (Retrocesso de Transmissão e Ao Vivo)
    if (dom.btnRewind10) {
      dom.btnRewind10.addEventListener('click', (e) => {
        e.stopPropagation();
        streamPlayer.seekRelative(-10);
        ui.showToast('⏪ -10s na transmissão');
      });
    }

    if (dom.btnForward10) {
      dom.btnForward10.addEventListener('click', (e) => {
        e.stopPropagation();
        streamPlayer.seekRelative(10);
        const state = streamPlayer.getDVRState();
        if (state.isLive) {
          ui.showToast('🔴 Sincronizado no AO VIVO');
        } else {
          ui.showToast('⏩ +10s na transmissão');
        }
      });
    }

    const triggerGoLive = (e) => {
      if (e) e.stopPropagation();
      streamPlayer.seekToLive();
      ui.showToast('🔴 Sincronizado no AO VIVO');
    };

    if (dom.btnLiveIndicator) dom.btnLiveIndicator.addEventListener('click', triggerGoLive);
    if (dom.osdLivePillTop) dom.osdLivePillTop.addEventListener('click', triggerGoLive);

    // Linha do Tempo DVR Scrubber
    if (dom.dvrTimelineContainer) {
      let isDraggingDVR = false;

      const handleDVRSeek = (clientX) => {
        const rect = dom.dvrTimelineContainer.getBoundingClientRect();
        const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        streamPlayer.seekToRatio(ratio);
        const state = streamPlayer.getDVRState();
        ui.updateDVR(state);
      };

      dom.dvrTimelineContainer.addEventListener('mousedown', (e) => {
        isDraggingDVR = true;
        dom.dvrTimelineContainer.classList.add('dragging');
        handleDVRSeek(e.clientX);
      });

      window.addEventListener('mousemove', (e) => {
        if (isDraggingDVR) {
          handleDVRSeek(e.clientX);
        }
        if (dom.dvrTimelineContainer && dom.dvrHoverTooltip) {
          const rect = dom.dvrTimelineContainer.getBoundingClientRect();
          if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top - 20 && e.clientY <= rect.bottom + 20) {
            const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            const range = streamPlayer.getSeekableRange();
            const liveEdge = streamPlayer.getLiveEdge();
            const duration = Math.max(1, range.end - range.start);
            const hoverTime = range.start + (ratio * duration);
            const delaySec = Math.max(0, liveEdge - hoverTime);

            dom.dvrHoverTooltip.style.left = (ratio * 100).toFixed(1) + '%';
            if (delaySec <= 4) {
              dom.dvrHoverTooltip.textContent = 'Ao Vivo';
            } else {
              dom.dvrHoverTooltip.textContent = '-' + ui.formatDVRTime(delaySec);
            }
          }
        }
      });

      window.addEventListener('mouseup', () => {
        if (isDraggingDVR) {
          isDraggingDVR = false;
          if (dom.dvrTimelineContainer) dom.dvrTimelineContainer.classList.remove('dragging');
        }
      });

      dom.dvrTimelineContainer.addEventListener('touchstart', (e) => {
        if (e.touches.length > 0) {
          isDraggingDVR = true;
          handleDVRSeek(e.touches[0].clientX);
        }
      }, { passive: true });

      dom.dvrTimelineContainer.addEventListener('touchmove', (e) => {
        if (isDraggingDVR && e.touches.length > 0) {
          handleDVRSeek(e.touches[0].clientX);
        }
      }, { passive: true });

      dom.dvrTimelineContainer.addEventListener('touchend', () => {
        isDraggingDVR = false;
      });
    }

    if (dom.btnToggleSidebar) dom.btnToggleSidebar.addEventListener('click', () => ui.toggleSidebar());
    if (dom.btnToggleSidebarTop) dom.btnToggleSidebarTop.addEventListener('click', () => ui.toggleSidebar());
    if (dom.btnCloseSidebar) dom.btnCloseSidebar.addEventListener('click', () => dom.sidebar.classList.add('collapsed'));

    if (dom.btnRetryStream) dom.btnRetryStream.addEventListener('click', () => playChannelByIndex(channelManager.currentIndex));
    
    const btnSwitch = document.getElementById('btn-switch-source');
    if (btnSwitch) {
      btnSwitch.addEventListener('click', () => {
        const ch = channelManager.getCurrentChannel();
        if (ch && ch.backupUrl) {
          streamPlayer.isUsingBackup = !streamPlayer.isUsingBackup;
          const target = streamPlayer.isUsingBackup ? ch.backupUrl : ch.url;
          ui.showToast(streamPlayer.isUsingBackup ? '📡 Alternando para Sinal 2' : '📡 Alternando para Sinal 1');
          streamPlayer.playSource(streamPlayer.getResolvedPlayUrl(target));
        } else {
          ui.showToast('Canal com sinal único ativo.');
        }
      });
    }

    if (dom.btnTryBackup) {
      dom.btnTryBackup.addEventListener('click', () => {
        const ch = channelManager.getCurrentChannel();
        if (ch && ch.backupUrl && !streamPlayer.isUsingBackup) {
          streamPlayer.isUsingBackup = true;
          ui.showToast('📡 Alternando para Sinal 2 (Reserva)');
          streamPlayer.playSource(streamPlayer.getResolvedPlayUrl(ch.backupUrl));
        } else {
          playChannelByIndex(channelManager.getNextIndex());
        }
      });
    }

    // Clique e duplo-clique no vídeo
    let clickTimeout = null;
    dom.video.addEventListener('click', () => {
      if (clickTimeout) {
        clearTimeout(clickTimeout);
        clickTimeout = null;
        toggleFullscreen();
      } else {
        clickTimeout = setTimeout(() => {
          clickTimeout = null;
          streamPlayer.togglePlay();
        }, 250);
      }
    });

    // Inatividade
    dom.playerViewport.addEventListener('mousemove', () => ui.resetIdleTimer(!dom.video.paused));
    dom.playerViewport.addEventListener('touchstart', () => ui.resetIdleTimer(!dom.video.paused), { passive: true });

    // Pesquisa
    if (dom.searchInput) {
      dom.searchInput.addEventListener('input', () => {
        if (dom.btnClearSearch) {
          dom.btnClearSearch.style.display = dom.searchInput.value ? 'block' : 'none';
        }
        channelManager.setSearchQuery(dom.searchInput.value);
        renderUI();
      });
    }

    if (dom.btnClearSearch) {
      dom.btnClearSearch.addEventListener('click', () => {
        dom.searchInput.value = '';
        dom.btnClearSearch.style.display = 'none';
        channelManager.setSearchQuery('');
        renderUI();
        dom.searchInput.focus();
      });
    }

    // Categorias
    if (dom.categoryPills) {
      dom.categoryPills.addEventListener('click', (e) => {
        const pill = e.target.closest('.category-pill');
        if (!pill) return;
        document.querySelectorAll('.category-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');

        const cat = pill.getAttribute('data-category');
        channelManager.setCategory(cat);
        if (dom.currentCategoryName) {
          dom.currentCategoryName.textContent = pill.textContent.split(' ')[0];
        }
        renderUI();
      });
    }

    // Modal de Atalhos
    if (dom.btnShortcuts && dom.shortcutsModal) {
      dom.btnShortcuts.addEventListener('click', () => dom.shortcutsModal.classList.add('open'));
    }
    if (dom.btnCloseShortcuts && dom.shortcutsModal) {
      dom.btnCloseShortcuts.addEventListener('click', () => dom.shortcutsModal.classList.remove('open'));
    }
    if (dom.shortcutsModal) {
      dom.shortcutsModal.addEventListener('click', (e) => {
        if (e.target === dom.shortcutsModal) dom.shortcutsModal.classList.remove('open');
      });
    }

    // Modal Assistir no Celular
    if (dom.btnOpenMobileModal && dom.mobileModal) {
      dom.btnOpenMobileModal.addEventListener('click', () => {
        const origin = window.location.origin;
        const mobileUrl = origin.startsWith('http') ? `${origin}/mobile` : 'http://localhost:3000/mobile';
        if (dom.mobileLinkText) dom.mobileLinkText.textContent = mobileUrl;
        if (dom.qrCodeImg) dom.qrCodeImg.src = `/api/qrcode?t=${Date.now()}`;
        dom.mobileModal.classList.add('open');
      });
    }
    if (dom.btnCloseMobileModal && dom.mobileModal) {
      dom.btnCloseMobileModal.addEventListener('click', () => dom.mobileModal.classList.remove('open'));
    }
    if (dom.mobileModal) {
      dom.mobileModal.addEventListener('click', (e) => {
        if (e.target === dom.mobileModal) dom.mobileModal.classList.remove('open');
      });
    }

    // Tela Cheia Ícone
    document.addEventListener('fullscreenchange', () => {
      const isFs = !!document.fullscreenElement;
      if (dom.iconFsEnter && dom.iconFsExit) {
        dom.iconFsEnter.style.display = isFs ? 'none' : 'block';
        dom.iconFsExit.style.display = isFs ? 'block' : 'none';
      }
    });

    // Atalhos Globais de Teclado
    document.addEventListener('keydown', (e) => {
      if (document.activeElement === dom.searchInput) return;

      switch (e.key) {
        case ' ':
        case 'k':
        case 'K':
          e.preventDefault();
          streamPlayer.togglePlay();
          break;
        case 'j':
        case 'J':
          e.preventDefault();
          streamPlayer.seekRelative(-10);
          ui.showToast('⏪ -10s na transmissão');
          break;
        case 'l':
        case 'L':
          e.preventDefault();
          streamPlayer.seekRelative(10);
          {
            const state = streamPlayer.getDVRState();
            if (state.isLive) {
              ui.showToast('🔴 Sincronizado no AO VIVO');
            } else {
              ui.showToast('⏩ +10s na transmissão');
            }
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          playChannelByIndex(channelManager.getNextIndex());
          break;
        case 'ArrowLeft':
          e.preventDefault();
          playChannelByIndex(channelManager.getPrevIndex());
          break;
        case 'ArrowUp':
          e.preventDefault();
          streamPlayer.setVolume(dom.video.volume + 0.05);
          ui.showToast(`Volume: ${Math.round(dom.video.volume * 100)}%`);
          break;
        case 'ArrowDown':
          e.preventDefault();
          streamPlayer.setVolume(dom.video.volume - 0.05);
          ui.showToast(`Volume: ${Math.round(dom.video.volume * 100)}%`);
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          streamPlayer.toggleMute();
          break;
        case 'c':
        case 'C':
          e.preventDefault();
          ui.toggleSidebar();
          break;
        case 's':
        case 'S': {
          e.preventDefault();
          const ch = channelManager.getCurrentChannel();
          if (ch && ch.backupUrl) {
            streamPlayer.isUsingBackup = !streamPlayer.isUsingBackup;
            const target = streamPlayer.isUsingBackup ? ch.backupUrl : ch.url;
            ui.showToast(streamPlayer.isUsingBackup ? '📡 Alternando para Sinal 2' : '📡 Alternando para Sinal 1');
            streamPlayer.playSource(streamPlayer.getResolvedPlayUrl(target));
          } else {
            ui.showToast('Canal com sinal único.');
          }
          break;
        }
        case 'r':
        case 'R':
          e.preventDefault();
          ui.showToast('Recarregando canal...');
          playChannelByIndex(channelManager.currentIndex);
          break;
        case 'h':
        case 'H':
          if (dom.shortcutsModal) dom.shortcutsModal.classList.toggle('open');
          break;
        case 'Escape':
          if (dom.shortcutsModal) dom.shortcutsModal.classList.remove('open');
          break;
        default:
          if (/^[0-9]$/.test(e.key)) {
            handleDigitKey(e.key);
          }
          break;
      }
    });
  }

  // Inicialização
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
