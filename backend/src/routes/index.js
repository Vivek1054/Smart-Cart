import { Router } from 'express';
import catalogRoutes from './catalog.routes.js';
import shopperRoutes from './shopper.routes.js';
import adminRoutes from './admin.routes.js';

const v1 = Router();
v1.use('/admin', adminRoutes);
v1.use('/', catalogRoutes);
v1.use('/', shopperRoutes);

export default v1;
