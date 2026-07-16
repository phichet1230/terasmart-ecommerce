const BASE_URL = 'http://localhost:5000';

async function runTests() {
  console.log('🧪 Starting Authentication, Product & Cart API Verification...\n');
  let token = '';
  let testEmail = `user_${Date.now()}@terasmart.com`;
  let testUsername = `TestUser${Array.from({length: 6}, () => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join('')}`;
  let testPhone = '08' + Array.from({length: 8}, () => Math.floor(Math.random() * 10)).join('');
  let firstProductVariantId = null;
  let cartItemId = null;

  try {
    // ==========================================
    // 1. AUTHENTICATION TESTS
    // ==========================================
    console.log('--- 1. Testing Authentication ---');
    
    // 1.1 Test Username validation (Must fail if contains numbers)
    console.log('⏳ Registering with numeric username (should fail)...');
    const registerFailRes = await fetch(`${BASE_URL}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'Somchai99',
        email: testEmail,
        phone: '0812345678',
        password: 'password123'
      })
    });
    const registerFailData = await registerFailRes.json();
    if (registerFailRes.status === 400 && registerFailData.errors && registerFailData.errors.username) {
      console.log('✅ Success: Username with digits correctly rejected!');
    } else {
      throw new Error(`Username validation failed to reject digits: ${JSON.stringify(registerFailData)}`);
    }

    // 1.2 Test successful registration
    console.log(`⏳ Registering safe username: ${testUsername}...`);
    const registerRes = await fetch(`${BASE_URL}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: testUsername,
        email: testEmail,
        phone: testPhone,
        password: 'password123'
      })
    });
    const registerData = await registerRes.json();
    if (registerRes.status === 201 && registerData.status === 'success') {
      console.log('✅ Success: User registered successfully!');
    } else {
      throw new Error(`Register failed: ${JSON.stringify(registerData)}`);
    }

    // 1.3 Test Login
    console.log('⏳ Logging in...');
    const loginRes = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'password123'
      })
    });
    const loginData = await loginRes.json();
    if (loginRes.status === 200 && loginData.data && loginData.data.token) {
      token = loginData.data.token;
      console.log('✅ Success: Logged in successfully! JWT token received.');
    } else {
      throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
    }

    // ==========================================
    // 2. PRODUCT CATALOGUE TESTS
    // ==========================================
    console.log('\n--- 2. Testing Product Catalog ---');

    // 2.1 Fetch all products (Base query)
    console.log('⏳ Fetching all products...');
    const allProdRes = await fetch(`${BASE_URL}/api/v1/products`);
    const allProdData = await allProdRes.json();
    if (allProdRes.status === 200 && allProdData.status === 'success') {
      console.log(`✅ Success: Fetched ${allProdData.results} products.`);
    } else {
      throw new Error(`Failed to fetch all products: ${JSON.stringify(allProdData)}`);
    }

    // 2.2 Pagination Test (limit=2, offset=0)
    console.log('⏳ Fetching products with Pagination (limit=2, offset=0)...');
    const pageRes = await fetch(`${BASE_URL}/api/v1/products?limit=2&offset=0`);
    const pageData = await pageRes.json();
    if (pageRes.status === 200 && pageData.limit === 2 && pageData.data.length <= 2) {
      console.log(`✅ Success: Pagination limit=2 verified! (Returned ${pageData.data.length} products, total=${pageData.total})`);
    } else {
      throw new Error(`Pagination failed: ${JSON.stringify(pageData)}`);
    }

    // 2.3 Search Test (search=Phone)
    console.log('⏳ Searching products (search=Phone)...');
    const searchRes = await fetch(`${BASE_URL}/api/v1/products?search=Phone`);
    const searchData = await searchRes.json();
    if (searchRes.status === 200 && searchData.data.every(p => p.name.includes('Phone') || p.short_description.includes('Phone'))) {
      console.log(`✅ Success: Search filter verified! (Found ${searchData.data.length} products containing "Phone")`);
    } else {
      throw new Error(`Search failed or returned invalid results: ${JSON.stringify(searchData)}`);
    }

    // 2.4 Category Filter Test (category=1)
    console.log('⏳ Filtering products by category ID 1...');
    const catRes = await fetch(`${BASE_URL}/api/v1/products?category=1`);
    const catData = await catRes.json();
    if (catRes.status === 200 && catData.data.every(p => p.category_id === 1)) {
      console.log(`✅ Success: Category filter verified! (Found ${catData.data.length} products in Category 1)`);
    } else {
      throw new Error(`Category filter failed: ${JSON.stringify(catData)}`);
    }

    // 2.5 Price Range Filter Test (min_price=1000, max_price=10000)
    console.log('⏳ Filtering products by Price Range (1,000 - 10,000)...');
    const priceRes = await fetch(`${BASE_URL}/api/v1/products?min_price=1000&max_price=10000`);
    const priceData = await priceRes.json();
    const priceMatch = priceData.data.every(p => {
      const minPrice = parseFloat(p.min_price);
      const maxPrice = parseFloat(p.max_price);
      return minPrice >= 1000 && maxPrice <= 10000;
    });
    if (priceRes.status === 200 && priceMatch) {
      console.log(`✅ Success: Price filter verified! (Found ${priceData.data.length} products within price range)`);
    } else {
      throw new Error(`Price range filter failed: ${JSON.stringify(priceData)}`);
    }

    // 2.6 Detailed Product Lookup (Get variants)
    const productSlug = allProdData.data[0].slug;
    console.log(`⏳ Fetching product details for slug: ${productSlug}...`);
    const detailRes = await fetch(`${BASE_URL}/api/v1/products/${productSlug}`);
    const detailData = await detailRes.json();
    if (detailRes.status === 200 && detailData.data.variants.length > 0) {
      firstProductVariantId = detailData.data.variants[0].id;
      console.log(`✅ Success: Detailed lookup verified! Selected Variant ID: ${firstProductVariantId}`);
    } else {
      throw new Error(`Detailed product lookup failed: ${JSON.stringify(detailData)}`);
    }

    // ==========================================
    // 3. CART MANAGEMENT TESTS
    // ==========================================
    console.log('\n--- 3. Testing Cart Management ---');

    // 3.1 Add Item to Cart
    console.log(`⏳ Adding variant ${firstProductVariantId} to cart...`);
    const addCartRes = await fetch(`${BASE_URL}/api/v1/cart/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        variant_id: firstProductVariantId,
        quantity: 2
      })
    });
    const addCartData = await addCartRes.json();
    if (addCartRes.status === 200 && addCartData.status === 'success') {
      console.log('✅ Success: Product variant added to cart!');
    } else {
      throw new Error(`Add to cart failed: ${JSON.stringify(addCartData)}`);
    }

    // 3.2 Retrieve Cart
    console.log('⏳ Retrieving cart...');
    const getCartRes = await fetch(`${BASE_URL}/api/v1/cart`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const getCartData = await getCartRes.json();
    if (getCartRes.status === 200 && getCartData.data.length > 0) {
      const item = getCartData.data.find(i => i.variant_id === firstProductVariantId);
      cartItemId = item.cart_item_id;
      console.log(`✅ Success: Cart retrieved! Quantity of item: ${item.quantity} (Cart Item ID: ${cartItemId})`);
    } else {
      throw new Error(`Retrieve cart failed: ${JSON.stringify(getCartData)}`);
    }

    // 3.3 Update Cart Item Quantity
    console.log(`⏳ Updating cart item ${cartItemId} quantity to 1...`);
    const updateCartRes = await fetch(`${BASE_URL}/api/v1/cart/items/${cartItemId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        quantity: 1
      })
    });
    const updateCartData = await updateCartRes.json();
    if (updateCartRes.status === 200 && updateCartData.status === 'success') {
      console.log('✅ Success: Cart item quantity updated!');
    } else {
      throw new Error(`Update cart item failed: ${JSON.stringify(updateCartData)}`);
    }

    // 3.4 Delete Cart Item
    console.log(`⏳ Deleting cart item ${cartItemId} from cart...`);
    const delCartRes = await fetch(`${BASE_URL}/api/v1/cart/items/${cartItemId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const delCartData = await delCartRes.json();
    if (delCartRes.status === 200 && delCartData.status === 'success') {
      console.log('✅ Success: Cart item deleted!');
    } else {
      throw new Error(`Delete cart item failed: ${JSON.stringify(delCartData)}`);
    }

    console.log('\n🌟 ALL AUTHENTICATION, PRODUCT & CART API TESTS PASSED SUCCESSFULLY! 🌟');

  } catch (err) {
    console.error('\n❌ API Verification Failed:', err.message);
  }
}

runTests();
