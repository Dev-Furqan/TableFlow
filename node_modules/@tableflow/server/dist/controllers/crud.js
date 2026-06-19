import { AppError, asyncHandler } from '../utils/errors.js';
export const crud = (model, populate = '') => ({
    list: asyncHandler(async (req, res) => { const page = Math.max(1, Number(req.query.page) || 1), limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25)); const filter = {}; if (req.query.search) {
        const fields = ['name', 'orderNumber', 'phone', 'sku', 'category'];
        filter.$or = fields.map(k => ({ [k]: { $regex: String(req.query.search), $options: 'i' } }));
    } if (req.query.status)
        filter.status = req.query.status; if (req.query.type)
        filter.type = req.query.type; let q = model.find(filter).sort(String(req.query.sort || '-createdAt')).skip((page - 1) * limit).limit(limit); if (populate)
        q = q.populate(populate); const [data, total] = await Promise.all([q.lean(), model.countDocuments(filter)]); res.json({ data, meta: { page, limit, total, pages: Math.ceil(total / limit) } }); }),
    get: asyncHandler(async (req, res) => { let q = model.findById(req.params.id); if (populate)
        q = q.populate(populate); const data = await q; if (!data)
        throw new AppError(404, 'Record not found'); res.json({ data }); }),
    create: asyncHandler(async (req, res) => { const data = await model.create(req.body); res.status(201).json({ data }); }),
    update: asyncHandler(async (req, res) => { const data = await model.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }); if (!data)
        throw new AppError(404, 'Record not found'); res.json({ data }); }),
    remove: asyncHandler(async (req, res) => { const data = await model.findByIdAndDelete(req.params.id); if (!data)
        throw new AppError(404, 'Record not found'); res.status(204).end(); })
});
//# sourceMappingURL=crud.js.map