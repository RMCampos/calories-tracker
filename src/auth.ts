import { getDivById } from "./DomUtils";

export function showAuthForms() {
  getDivById('auth-section').classList.remove('hidden');
  getDivById('user-info').classList.add('hidden');
  getDivById('app-content').classList.add('hidden');
}

export function toggleAuthForms() {
  document.getElementById('login-form')?.classList.toggle('hidden');
  document.getElementById('register-form')?.classList.toggle('hidden');
  
  const logForm = document.getElementById('loginForm') as HTMLFormElement;
  logForm.reset();

  const resetForm = document.getElementById('registerForm') as HTMLFormElement;
  resetForm.reset();
}
