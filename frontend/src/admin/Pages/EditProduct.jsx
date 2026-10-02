import React from 'react';
import { useParams } from 'react-router-dom';
import ProductForm from '../components/ProductForm';
import { getProductByIdForAdmin, adminUpdateProduct } from '../../data/products';
import { useCatalogVersion } from '../../context/CatalogContext';
import NotFound from '../../Pages/NotFound';

const EditProduct = () => {
  const { id } = useParams();
  const catalogVersion = useCatalogVersion();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const product = React.useMemo(() => getProductByIdForAdmin(id), [id, catalogVersion]);

  if (!product) return <NotFound />;

  return (
    <div className="max-w-5xl">
      <ProductForm initial={product} onSubmit={(data) => adminUpdateProduct(product.id, data)} submitLabel="Save Changes" />
    </div>
  );
};

export default EditProduct;
