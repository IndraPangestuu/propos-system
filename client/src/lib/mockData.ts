
export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  image: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface User {
  id: string;
  name: string;
  role: 'admin' | 'employee';
  email: string;
}

export const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Espresso Intenso',
    category: 'Coffee',
    price: 3.50,
    stock: 45,
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&q=80',
  },
  {
    id: '2',
    name: 'Cappuccino Royale',
    category: 'Coffee',
    price: 4.50,
    stock: 28,
    image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400&q=80',
  },
  {
    id: '3',
    name: 'Matcha Green Tea Latte',
    category: 'Tea',
    price: 5.00,
    stock: 15,
    image: 'https://images.unsplash.com/photo-1515825838458-f2a94b20105a?w=400&q=80',
  },
  {
    id: '4',
    name: 'Blueberry Muffin',
    category: 'Bakery',
    price: 3.25,
    stock: 12,
    image: 'https://images.unsplash.com/photo-1558303420-f814d8a590f5?w=400&q=80',
  },
  {
    id: '5',
    name: 'Chocolate Croissant',
    category: 'Bakery',
    price: 3.75,
    stock: 8,
    image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&q=80',
  },
  {
    id: '6',
    name: 'Iced Caramel Macchiato',
    category: 'Cold Drinks',
    price: 5.50,
    stock: 50,
    image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&q=80',
  },
  {
    id: '7',
    name: 'Avocado Toast',
    category: 'Food',
    price: 8.50,
    stock: 10,
    image: 'https://images.unsplash.com/photo-1588137372308-15f75323ca8d?w=400&q=80',
  },
  {
    id: '8',
    name: 'Berry Smoothie Bowl',
    category: 'Food',
    price: 9.00,
    stock: 5,
    image: 'https://images.unsplash.com/photo-1626078436812-780c13e094d4?w=400&q=80',
  },
  {
    id: '9',
    name: 'Mineral Water',
    category: 'Cold Drinks',
    price: 1.50,
    stock: 100,
    image: 'https://images.unsplash.com/photo-1564414277413-4a0b22f60579?w=400&q=80',
  },
  {
    id: '10',
    name: 'Fresh Orange Juice',
    category: 'Cold Drinks',
    price: 4.00,
    stock: 20,
    image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=400&q=80',
  }
];

export const SALES_DATA = [
  { name: 'Mon', sales: 4000 },
  { name: 'Tue', sales: 3000 },
  { name: 'Wed', sales: 2000 },
  { name: 'Thu', sales: 2780 },
  { name: 'Fri', sales: 1890 },
  { name: 'Sat', sales: 2390 },
  { name: 'Sun', sales: 3490 },
];

export const CATEGORIES = ['All', 'Coffee', 'Tea', 'Bakery', 'Food', 'Cold Drinks'];
