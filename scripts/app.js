//  DOM VARIABLES

const cartButton = document.querySelector('.cart-btn'),
      closeCartButton = document.querySelector('.close-cart'),
      clearCartButton = document.querySelector('.clear-cart'),
      cartDOM = document.querySelector('.cart'),
      cartOverlay = document.querySelector('.cart-overlay'),
      cartItems = document.querySelector('.cart-items'),
      cartTotal = document.querySelector('.cart-total'),
      cartContent = document.querySelector('.cart-content'),
      productsDOM = document.querySelector('.products-center');

let cart = [];
let buttonsDOM = [];

class Products {
  async getProducts() {
    try {
      let result = await fetch('products.json');
      let data = await result.json();
      let products = data.items;
      products = products.map(item => {
        const { title, price } = item.fields;
        const { id } = item.sys;
        const image = item.fields.image.fields.file.url;
        return { title, price, id, image };
      });
      return products;
    } catch(err) {
      console.log(err);
    }
  }
}

class UI {
  displayProducts(products) {
    let result = '';
    products.forEach(product => {
      const { image, id, title, price } = product;
      result += `
      <article class="product">
        <div class="img-container">
          <img src=${image} alt="product" class="product-img" />
          <button class="bag-btn" data-id=${id}>
            <i class="fas fa-shopping-cart"></i>
            Add to bag
          </button>
        </div>
        <h3>${title}</h3>
        <h4>$${price}</h4>
      </article>
      `;
    });

    productsDOM.innerHTML = result;
  }

  getBagButtons() {
    const buttons = [...document.querySelectorAll('.bag-btn')];
    buttonsDOM = buttons;

    buttons.forEach(button => {
      let id = button.dataset.id;
      let inCart = cart.find(item => item.id === id);

      if(inCart) {
        button.innerText = 'In Cart';
        button.disabled = true;
      }
      button.addEventListener('click', e => {
        e.target.innerText = 'In Cart';
        e.target.disabled = true;
        // get product from products
        let cartItem = {...Storage.getProduct(id), amount: 1 };
        // add product to the cart
        cart = [...cart, cartItem];
        // save cart in local storage
        Storage.saveCart(cart);
        // set cart value
        this.setCartValues(cart);
        // display cart item
        this.addCartItem(cartItem);
        // show cart
        this.showCart();
      });
    });
  }

  setCartValues(cart) {
    let tempTotal = 0;
    let itemsTotal = 0;

    cart.map(item => {
      tempTotal += item.price * item.amount;
      itemsTotal += item.amount;
    });

    cartTotal.innerText = parseFloat(tempTotal.toFixed(2));
    cartItems.innerText = itemsTotal;
  }

  addCartItem(item) {
    const div = document.createElement('div');
    div.classList.add('cart-item');
    div.innerHTML = 
      `
        <img src=${item.image} alt="product" />
        <div>
          <h4>${item.title}</h4>
          <h5>${item.price}</h5>
          <span class="remove-item" data-id=${item.id}>remove</span>
        </div>
        <div>
          <i class="fas fa-chevron-up" data-id=${item.id}></i>
          <p class="item-amount">${item.amount}</p>
          <i class="fas fa-chevron-down" data-id=${item.id}></i>
        </div>
      `;

    cartContent.appendChild(div);
  }

  showCart() {
    cartOverlay.classList.add('transparentBcg');
    cartDOM.classList.add('showCart');
  }

  hideCart() {
    cartOverlay.classList.remove('transparentBcg');
    cartDOM.classList.remove('showCart');
  }

  setupAPP() {
    cart = Storage.getCart();
    this.setCartValues(cart);
    this.populateCart(cart);
    cartButton.addEventListener('click', this.showCart);
    closeCartButton.addEventListener('click', this.hideCart);
  }

  populateCart(cart) {
    cart.forEach(item => this.addCartItem(item));
  }

  getSingleButton(id) {
    return buttonsDOM.find(button => button.dataset.id === id);
  }

  removeItem(id) {
    cart = cart.filter(item => item.id !== id);
    this.setCartValues(cart);
    Storage.saveCart(cart);
    let button = this.getSingleButton(id);
    button.disabled = false;
    button.innerHTML = `<i class="fas fa-shopping-cart"></i> add to cart`;
  }

  clearCart() {
    let cartItems = cart.map(item => item.id);
    cartItems.forEach(id => this.removeItem(id));

    while(cartContent.children.length > 0) {
      cartContent.removeChild(cartContent.children[0]);
    }

    this.hideCart();
  }

  cartLogic() {
    clearCartButton.addEventListener('click', () => {
      this.clearCart();
    });

    cartContent.addEventListener('click', e => {
      if(e.target.classList.contains('remove-item')) {
        let removeItem = e.target;
        let id = removeItem.dataset.id;
        this.removeItem(id);
        cartContent.removeChild(removeItem.parentElement.parentElement);
      } else if (e.target.classList.contains('fa-chevron-up')) {
        let addAmount = e.target;
        let id = addAmount.dataset.id;
        let tempItem = cart.find(item => item.id === id);
        tempItem.amount += 1;

        Storage.saveCart(cart);
        this.setCartValues(cart);

        addAmount.nextElementSibling.innerText = tempItem.amount;
      } else if(e.target.classList.contains('fa-chevron-down')) {
        let lowerAmount = e.target;
        let id = lowerAmount.dataset.id;
        let tempItem = cart.find(item => item.id === id);
        tempItem.amount -= 1;

          if(tempItem.amount > 0) {
            Storage.saveCart(cart);
            this.setCartValues(cart);

            lowerAmount.previousElementSibling.innerText = tempItem.amount;
          } else {
            cartContent.removeChild(lowerAmount.parentElement.parentElement);
            this.removeItem(id);
          }
      }
    });
  }
}

class Storage {
  static saveProducts(products) {
    localStorage.setItem('products', JSON.stringify(products));
  }

  static getProduct(id) {
    let products = JSON.parse(localStorage.getItem('products'));
    return products.find(product => product.id === id);
  }

  static saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
  }

  static getCart() {
    return localStorage.getItem('cart') ? JSON.parse(localStorage.getItem('cart')) : [];
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const ui = new UI();
  const products = new Products();

  ui.setupAPP();

  // get all product
  products.getProducts()
    .then(products => {
      ui.displayProducts(products);
      Storage.saveProducts(products);
    })
    .then(() => {
      ui.getBagButtons();
      ui.cartLogic();
    })
    .catch(err => console.log(err));
});