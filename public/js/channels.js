/**
 * IPTV Pro Brasil - Channel Manager
 * Gerencia a lista de canais, categorias, favoritos e filtros de busca.
 */

class ChannelManager {
  constructor(initialChannels = []) {
    this.allChannels = initialChannels;
    this.filteredChannels = [...initialChannels];
    this.currentCategory = 'ALL';
    this.searchQuery = '';
    this.currentIndex = 0;
    
    // Carregar favoritos do LocalStorage
    this.favorites = new Set();
    try {
      const saved = localStorage.getItem(IPTV_CONFIG.storageKeys.favorites);
      if (saved) {
        JSON.parse(saved).forEach(name => this.favorites.add(name));
      }
    } catch (e) {
      console.warn('[Channels] Erro ao carregar favoritos:', e);
    }
  }

  setChannels(channels) {
    if (Array.isArray(channels) && channels.length > 0) {
      this.allChannels = channels;
      this.applyFilter();
    }
  }

  setCategory(category) {
    this.currentCategory = category;
    this.applyFilter();
  }

  setSearchQuery(query) {
    this.searchQuery = (query || '').toLowerCase().trim();
    this.applyFilter();
  }

  applyFilter() {
    const q = this.searchQuery;
    const cat = this.currentCategory;

    this.filteredChannels = this.allChannels.filter(channel => {
      // Filtro de Texto
      const matchText = !q ||
        channel.name.toLowerCase().includes(q) ||
        channel.group.toLowerCase().includes(q);

      if (!matchText) return false;

      // Filtro de Categoria
      if (cat === 'ALL') return true;
      if (cat === 'FAV') return this.favorites.has(channel.name);
      return channel.group === cat || (cat === 'Canais Globo & Esportes' && channel.name.toLowerCase().includes('globo'));
    });

    if (this.currentIndex >= this.filteredChannels.length) {
      this.currentIndex = 0;
    }
  }

  toggleFavorite(channelName) {
    const isFav = this.favorites.has(channelName);
    if (isFav) {
      this.favorites.delete(channelName);
    } else {
      this.favorites.add(channelName);
    }

    try {
      localStorage.setItem(IPTV_CONFIG.storageKeys.favorites, JSON.stringify(Array.from(this.favorites)));
    } catch (e) {}

    if (this.currentCategory === 'FAV') {
      this.applyFilter();
    }

    return !isFav;
  }

  isFavorite(channelName) {
    return this.favorites.has(channelName);
  }

  getCurrentChannel() {
    return this.filteredChannels[this.currentIndex] || null;
  }

  getChannel(index) {
    return this.filteredChannels[index] || null;
  }

  setCurrentIndex(index) {
    if (index >= 0 && index < this.filteredChannels.length) {
      this.currentIndex = index;
      return true;
    }
    return false;
  }

  getNextIndex() {
    if (this.filteredChannels.length === 0) return 0;
    return (this.currentIndex + 1) % this.filteredChannels.length;
  }

  getPrevIndex() {
    if (this.filteredChannels.length === 0) return 0;
    return (this.currentIndex - 1 + this.filteredChannels.length) % this.filteredChannels.length;
  }

  getCategories() {
    const groups = new Set();
    this.allChannels.forEach(c => groups.add(c.group));
    return Array.from(groups);
  }
}

window.ChannelManager = ChannelManager;
