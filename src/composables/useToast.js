import { ref } from 'vue';

const toasts = ref([]);
let toastId = 0;

export function useToast() {
  const showToast = (message, type = 'info', duration = 3000) => {
    const id = ++toastId;
    const toast = {
      id,
      message,
      type,
      duration,
      show: true
    };
    
    toasts.value.push(toast);
    
    return id;
  };
  
  const removeToast = (id) => {
    toasts.value.splice(toasts.value.findIndex(toast => toast.id === id), 1);
  };
  
  const success = (message, duration) => showToast(message, 'success', duration);
  const error = (message, duration) => showToast(message, 'error', duration);
  const warning = (message, duration) => showToast(message, 'warning', duration);
  const info = (message, duration) => showToast(message, 'info', duration);
  
  return {
    toasts,
    showToast,
    removeToast,
    success,
    error,
    warning,
    info
  };
}
