import { createStore } from 'zustand/vanilla';

export interface ConectividadeStore {
  /** null enquanto o estado da rede ainda não é conhecido. */
  online: boolean | null;
  definir(online: boolean | null): void;
}

export function criarConectividadeStore() {
  return createStore<ConectividadeStore>()((set) => ({
    online: null,
    definir: (online) => set({ online }),
  }));
}

/** Formato mínimo do estado entregue pelo NetInfo. */
export interface EstadoDeRede {
  isConnected: boolean | null;
}

/** Há rede quando o sistema informa conexão; null significa desconhecido. */
export function estaOnline(estado: EstadoDeRede): boolean | null {
  return estado.isConnected;
}
