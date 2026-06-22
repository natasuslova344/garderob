Theme.init();

document.addEventListener('DOMContentLoaded', () => {
  Auth.init();
  UI.init();
  ItemForm.init();
  Wishlist.init();
  Looks.init();

  const session = Store.getSession();
  if (session) {
    try {
      AppState.setUser(session);
      UI.showApp();
    } catch {
      Store.clearSession();
      UI.showAuth();
    }
  } else {
    UI.showAuth();
  }
});
