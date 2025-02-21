
//checkUserRole function to load products when admin dashboard is shown
function showAuthScreen() {
    document.getElementById('auth-screen').style.display = 'block';
    document.getElementById('user-dashboard').style.display = 'none';
    document.getElementById('admin-dashboard').style.display = 'none';
}
function showAdminDashboard() {
document.getElementById('auth-screen').style.display = 'none';
document.getElementById('user-dashboard').style.display = 'none';
document.getElementById('admin-dashboard').style.display = 'block';
loadProducts();
loadAdminOrders();
}
// Profile Toggle Function
function showProfile() {
    document.getElementById('products-list').style.display = 'none';
    document.getElementById('profile-section').style.display = 'block';
    loadUserProfile();
    loadUserOrders();
}

// Add to showUserDashboard function
function showUserDashboard() {
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('user-dashboard').style.display = 'block';
    document.getElementById('admin-dashboard').style.display = 'none';
    document.getElementById('products-list').style.display = 'block';
    document.getElementById('profile-section').style.display = 'none';
    loadUserProducts();
}

document.getElementById('products-tab').addEventListener('click', (e) => {
e.preventDefault();
document.getElementById('products-content').classList.add('show', 'active');
document.getElementById('orders-content').classList.remove('show', 'active');
e.target.classList.add('active');
document.getElementById('orders-tab').classList.remove('active');
document.getElementById('payments-tab').classList.remove('active');

document.getElementById('payments-content').classList.remove('show', 'active');


});
document.getElementById('orders-tab').addEventListener('click', (e) => {
e.preventDefault();
document.getElementById('products-list').classList.add('show', 'active');
document.getElementById('products-content').classList.remove('show', 'active');
e.target.classList.add('active');
document.getElementById('products-tab').classList.remove('active');
document.getElementById('payments-tab').classList.remove('active');

document.getElementById('payments-content').classList.remove('show', 'active');

});

document.getElementById('order-search').addEventListener('input', function(e) {
    loadAdminOrders(e.target.value);
});
document.getElementById('login-tab').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('login-form').style.display = 'block';
    document.getElementById('signup-form').style.display = 'none';
    e.target.classList.add('active');
    document.getElementById('signup-tab').classList.remove('active');
});
document.getElementById('signup-tab').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('signup-form').style.display = 'block';
    document.getElementById('login-form').style.display = 'none';
    e.target.classList.add('active');
    document.getElementById('login-tab').classList.remove('active');
});
document.getElementById('payments-tab').addEventListener('click', (e) => {
    e.preventDefault();

    document.getElementById('payments-content').classList.add('show', 'active');
    document.getElementById('orders-content').classList.remove('show', 'active');
    document.getElementById('products-tab').classList.remove('active');
    document.getElementById('products-content').classList.remove('show','active')

    e.target.classList.add('active');
    document.getElementById('orders-tab').classList.remove('active');
    
});
