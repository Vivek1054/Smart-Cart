import React from 'react';
import { useParams } from 'react-router-dom';
import ProductForm from '../components/ProductForm';
import { getProductById, adminUpdateProduct } from '../../data/products';
import NotFound from '../../Pages/NotFound';

const EditProduct = () => {
  const { id } = useParams();
  const product = getProductById(id);

  if (!product) return <NotFound />;

  return (
    <div className="max-w-5xl">
      <ProductForm initial={product} onSubmit={(data) => adminUpdateProduct(product.id, data)} submitLabel="Save Changes" />
    </div>
  );
};

export default EditProduct;
