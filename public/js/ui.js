/**
 * IPTV Pro Brasil - UI Manager
 * Gerencia a interface do usuário, OSD, lista de canais, modais e notificações toast.
 */

class UIManager {
  constructor(domElements) {
    this.dom = domElements;
    this.toastTimer = null;
    this.idleTimer = null;
  }

  escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  getInitials(name) {
    if (!name) return 'TV';
    const parts = name.replace(/[^a-zA-Z0-9 ]/g, '').trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  renderChannelList(channels, activeIndex, favorites, onSelect, onToggleFav) {
    const list = this.dom.channelList;
    if (!list) return;

    list.innerHTML = '';
    if (this.dom.channelsCount) {
      this.dom.channelsCount.textContent = `${channels.length} canais`;
    }

    if (channels.length === 0) {
      list.innerHTML = `
        <div style="text-align:center; padding: 48px 16px; color: var(--text-dim); font-size: 0.9rem;">
          Nenhum canal encontrado para este filtro.
        </div>
      `;
      return;
    }

    const fragment = document.createDocumentFragment();

    channels.forEach((ch, index) => {
      const item = document.createElement('div');
      item.className = 'channel-item' + (index === activeIndex ? ' active' : '');
      item.id = 'channel-item-' + index;

      const isFav = favorites.has(ch.name);
      const initials = this.getInitials(ch.name);
      const logoSrc = ch.logo ? this.escapeHtml(ch.logo) : '';

      item.innerHTML = `
        <span class="channel-number">${index + 1}</span>
        <div class="channel-logo-wrapper">
          <div class="channel-avatar-fallback">${initials}</div>
          ${logoSrc ? `<img class="channel-logo" src="${logoSrc}" alt="${this.escapeHtml(ch.name)}" loading="lazy" referrerpolicy="no-referrer" style="display:none;" onload="this.style.display='block'; if(this.previousElementSibling) this.previousElementSibling.style.display='none';" onerror="this.remove();">` : ''}
        </div>
        <div class="channel-info">
          <div class="channel-name" title="${this.escapeHtml(ch.name)}">${this.escapeHtml(ch.name)}</div>
          <div class="channel-group-tag">${this.escapeHtml(ch.group)}</div>
        </div>
        <div class="channel-actions">
          <div class="equalizer-bars">
            <span class="eq-bar"></span>
            <span class="eq-bar"></span>
            <span class="eq-bar"></span>
          </div>
          <button class="channel-fav-btn${isFav ? ' favorited' : ''}" title="${isFav ? 'Remover dos Favoritos' : 'Favoritar Canal'}" data-name="${this.escapeHtml(ch.name)}">
            ★
          </button>
        </div>
      `;

      item.addEventListener('click', (e) => {
        if (e.target.closest('.channel-fav-btn')) return;
        onSelect(index);
      });

      const favBtn = item.querySelector('.channel-fav-btn');
      if (favBtn) {
        favBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          onToggleFav(ch.name);
        });
      }

      fragment.appendChild(item);
    });

    list.appendChild(fragment);
    this.scrollActiveIntoView(activeIndex);
  }

  scrollActiveIntoView(index) {
    const activeEl = document.getElementById('channel-item-' + index);
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }

  updateOSD(channel, index) {
    if (!channel) return;

    if (this.dom.osdTitle) this.dom.osdTitle.textContent = channel.name;
    if (this.dom.osdCategory) this.dom.osdCategory.textContent = channel.group;
    if (this.dom.channelStepperNumber) this.dom.channelStepperNumber.textContent = 'CH ' + (index + 1);

    const initials = this.getInitials(channel.name);
    if (this.dom.osdAvatarFallback) this.dom.osdAvatarFallback.textContent = initials;

    if (this.dom.osdAvatarFallback) this.dom.osdAvatarFallback.style.display = 'flex';
    if (this.dom.osdLogo) {
      this.dom.osdLogo.style.display = 'none';
      if (channel.logo) {
        this.dom.osdLogo.referrerPolicy = 'no-referrer';
        this.dom.osdLogo.onload = () => {
          this.dom.osdLogo.style.display = 'block';
          if (this.dom.osdAvatarFallback) this.dom.osdAvatarFallback.style.display = 'none';
        };
        this.dom.osdLogo.onerror = () => {
          this.dom.osdLogo.style.display = 'none';
          if (this.dom.osdAvatarFallback) this.dom.osdAvatarFallback.style.display = 'flex';
        };
        this.dom.osdLogo.src = channel.logo;
      }
    }

    // Atualiza itens na lista
    document.querySelectorAll('.channel-item').forEach((item, idx) => {
      if (idx === index) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    this.scrollActiveIntoView(index);
  }

  showStatus(text) {
    if (this.dom.statusLabel) this.dom.statusLabel.textContent = text;
    if (this.dom.statusOverlay) this.dom.statusOverlay.style.display = 'flex';
  }

  hideStatus() {
    if (this.dom.statusOverlay) this.dom.statusOverlay.style.display = 'none';
  }

  showError(msg) {
    this.hideStatus();
    if (this.dom.errorMessage) this.dom.errorMessage.textContent = msg;
    if (this.dom.errorCard) this.dom.errorCard.style.display = 'flex';
  }

  hideError() {
    if (this.dom.errorCard) this.dom.errorCard.style.display = 'none';
  }

  showToast(text, duration = 2200) {
    if (!this.dom.osdToast) return;
    this.dom.osdToast.textContent = text;
    this.dom.osdToast.classList.add('show');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.dom.osdToast.classList.remove('show');
    }, duration);
  }

  updatePlayState(isPlaying) {
    if (this.dom.iconPlay && this.dom.iconPause) {
      this.dom.iconPlay.style.display = isPlaying ? 'none' : 'block';
      this.dom.iconPause.style.display = isPlaying ? 'block' : 'none';
    }
  }

  updateVolume(volume, isMuted) {
    if (this.dom.volumeRange) this.dom.volumeRange.value = volume;
    if (this.dom.iconVolHigh && this.dom.iconVolMute) {
      if (isMuted || volume === 0) {
        this.dom.iconVolHigh.style.display = 'none';
        this.dom.iconVolMute.style.display = 'block';
      } else {
        this.dom.iconVolHigh.style.display = 'block';
        this.dom.iconVolMute.style.display = 'none';
      }
    }
  }

  toggleSidebar() {
    if (this.dom.sidebar) {
      this.dom.sidebar.classList.toggle('collapsed');
      const isCollapsed = this.dom.sidebar.classList.contains('collapsed');
      this.showToast(isCollapsed ? 'Guia Ocultado (Tela Cheia)' : 'Guia de Canais Aberto');
    }
  }

  resetIdleTimer(isPlaying) {
    if (!this.dom.playerViewport) return;
    this.dom.playerViewport.classList.remove('idle-hidden');
    clearTimeout(this.idleTimer);
    if (isPlaying) {
      this.idleTimer = setTimeout(() => {
        this.dom.playerViewport.classList.add('idle-hidden');
      }, 3500);
    }
  }

  // --- RECURSOS DVR UI ---
  formatDVRTime(totalSec) {
    totalSec = Math.max(0, Math.floor(totalSec));
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    if (h > 0) {
      return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  updateDVR(state) {
    if (!state) return;

    const playedPct = (state.progressRatio * 100).toFixed(2) + '%';
    const bufferPct = (state.bufferRatio * 100).toFixed(2) + '%';

    if (this.dom.dvrPlayedBar) this.dom.dvrPlayedBar.style.width = playedPct;
    if (this.dom.dvrBufferBar) this.dom.dvrBufferBar.style.width = bufferPct;
    if (this.dom.dvrPlayhead) this.dom.dvrPlayhead.style.left = playedPct;

    const formattedDelay = '-' + this.formatDVRTime(state.secondsBehindLive);

    // Botão Ao Vivo dos controles inferiores
    if (this.dom.btnLiveIndicator) {
      if (state.isLive) {
        this.dom.btnLiveIndicator.classList.remove('behind');
        this.dom.btnLiveIndicator.classList.add('live');
        if (this.dom.liveBadgeText) this.dom.liveBadgeText.textContent = 'AO VIVO';
        this.dom.btnLiveIndicator.setAttribute('data-tooltip', 'Sinal em tempo real (Ao Vivo)');
      } else {
        this.dom.btnLiveIndicator.classList.remove('live');
        this.dom.btnLiveIndicator.classList.add('behind');
        if (this.dom.liveBadgeText) this.dom.liveBadgeText.textContent = formattedDelay + ' AO VIVO';
        this.dom.btnLiveIndicator.setAttribute('data-tooltip', `Atraso: ${this.formatDVRTime(state.secondsBehindLive)} - Clique para voltar ao Vivo`);
      }
    }

    // Pílula superior do cabeçalho
    if (this.dom.osdLivePillTop) {
      if (state.isLive) {
        this.dom.osdLivePillTop.classList.remove('behind');
        if (this.dom.osdLivePillText) this.dom.osdLivePillText.textContent = 'AO VIVO';
      } else {
        this.dom.osdLivePillTop.classList.add('behind');
        if (this.dom.osdLivePillText) this.dom.osdLivePillText.textContent = formattedDelay + ' AO VIVO';
      }
    }
  }
}

window.UIManager = UIManager;
