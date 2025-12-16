import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

const QUEUE_KEY = 'offline_mutation_queue';

export type OfflineMutation = {
  id: string;
  type: 'SUBMIT_READING';
  payload: any;
  createdAt: number;
};

class MutationQueue {
  private queue: OfflineMutation[] = [];
  private isSyncing = false;

  constructor() {
    // Lazy initialization handled by init() method specifically for bundler safety
  }

  async init() {
    await this.loadQueue();
    // Auto-sync when online
    NetInfo.addEventListener(state => {
      if (state.isConnected) {
        this.processQueue();
      }
    });
  }

  private async loadQueue() {
    try {
      const stored = await AsyncStorage.getItem(QUEUE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load mutation queue', e);
    }
  }

  private async saveQueue() {
    try {
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(this.queue));
    } catch (e) {
      console.error('Failed to save mutation queue', e);
    }
  }

  async addMutation(mutation: Omit<OfflineMutation, 'id' | 'createdAt'>) {
    const newMutation: OfflineMutation = {
      ...mutation,
      id: Math.random().toString(36).substring(7),
      createdAt: Date.now(),
    };
    this.queue.push(newMutation);
    await this.saveQueue();
    
    // Try to process immediately if online
    const state = await NetInfo.fetch();
    if (state.isConnected) {
      this.processQueue();
    }
  }

  async processQueue() {
    if (this.isSyncing || this.queue.length === 0) return;
    this.isSyncing = true;

    const queueCopy = [...this.queue];
    const failedMutations: OfflineMutation[] = [];

    for (const mutation of queueCopy) {
      try {
        await this.executeMutation(mutation);
      } catch (error) {
        console.error(`Mutation ${mutation.id} failed`, error);
        failedMutations.push(mutation); 
      }
    }

    this.queue = failedMutations;
    await this.saveQueue();
    this.isSyncing = false;
  }

  private async executeMutation(mutation: OfflineMutation) {
    console.log('Processing mutation:', mutation);
    return new Promise(resolve => setTimeout(resolve, 1000));
  }

  getQueueLength() {
    return this.queue.length;
  }
}

export const mutationQueue = new MutationQueue();
