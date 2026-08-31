import React from 'react';
import ProductForm from '../components/ProductForm';
import { adminAddProduct } from '../../data/products';

const AddProduct = () => (
  <div className="max-w-5xl">
    <ProductForm onSubmit={(data) => adminAddProduct(data)} submitLabel="Add Product" />
  </div>
);

export default AddProduct;
