const router = require('express').Router();
const prisma = require('../db');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// Получить рецепты пользователя
router.get('/', async (req, res) => {
  try {
    const { search, category, favorites } = req.query;
    const userId = req.user.id;

    const where = { userId };
    if (category) where.category = category;
    if (favorites === 'true') where.isFavorite = true;
    if (search) where.name = { contains: search, mode: 'insensitive' };

    const recipes = await prisma.recipe.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    res.json(recipes.map(formatRecipe));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить один рецепт
router.get('/:id', async (req, res) => {
  try {
    const recipe = await prisma.recipe.findFirst({
      where: { id: Number(req.params.id), userId: req.user.id }
    });
    if (!recipe) return res.status(404).json({ error: 'Рецепт не найден' });
    res.json(formatRecipe(recipe));
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Создать рецепт
router.post('/', async (req, res) => {
  try {
    const { emoji, name, category, calories, time, servings, description, ingredients, steps } = req.body;
    if (!name) return res.status(400).json({ error: 'Название обязательно' });

    const recipe = await prisma.recipe.create({
      data: {
        userId: req.user.id,
        emoji: emoji || '🥗',
        name,
        category: category || 'Другое',
        calories: calories ? Number(calories) : null,
        time: time || null,
        servings: servings ? Number(servings) : null,
        description: description || null,
        ingredients: ingredients || [],
        steps: steps || []
      }
    });
    res.status(201).json(formatRecipe(recipe));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Обновить рецепт
router.put('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.recipe.findFirst({ where: { id, userId: req.user.id } });
    if (!existing) return res.status(404).json({ error: 'Рецепт не найден' });

    const { emoji, name, category, calories, time, servings, description, ingredients, steps } = req.body;
    const recipe = await prisma.recipe.update({
      where: { id },
      data: {
        emoji: emoji || '🥗',
        name,
        category: category || 'Другое',
        calories: calories ? Number(calories) : null,
        time: time || null,
        servings: servings ? Number(servings) : null,
        description: description || null,
        ingredients: ingredients || [],
        steps: steps || []
      }
    });
    res.json(formatRecipe(recipe));
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Переключить избранное
router.patch('/:id/favorite', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.recipe.findFirst({ where: { id, userId: req.user.id } });
    if (!existing) return res.status(404).json({ error: 'Рецепт не найден' });

    const recipe = await prisma.recipe.update({
      where: { id },
      data: { isFavorite: !existing.isFavorite }
    });
    res.json({ is_favorite: recipe.isFavorite });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Удалить рецепт
router.delete('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.recipe.findFirst({ where: { id, userId: req.user.id } });
    if (!existing) return res.status(404).json({ error: 'Рецепт не найден' });

    await prisma.recipe.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Привести к snake_case для совместимости с фронтендом
function formatRecipe(r) {
  return {
    id: r.id,
    user_id: r.userId,
    emoji: r.emoji,
    name: r.name,
    category: r.category,
    calories: r.calories,
    time: r.time,
    servings: r.servings,
    description: r.description,
    ingredients: r.ingredients,
    steps: r.steps,
    is_favorite: r.isFavorite,
    created_at: r.createdAt
  };
}

module.exports = router;
