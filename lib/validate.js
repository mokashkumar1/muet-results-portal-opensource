const { z } = require('zod');

const studentIdRegex = /^[\d\-]+[A-Z]+\d+$/i;

const gpaSchema = z.union([
  z.number().min(0).max(4.0),
  z.null(),
  z.undefined()
]);

const loginSchema = z.object({
  username: z.string().optional(),
  password: z.string().min(1, 'Password is required')
});

const extractSchema = z.object({
  image: z.string().refine(val => {
    return /^data:([A-Za-z-+\/]+);base64,(.+)$/.test(val);
  }, {
    message: 'Invalid base64 image data URL format'
  })
});

const studentResultSchema = z.object({
  id: z.string().trim().regex(studentIdRegex, 'Invalid Student ID format'),
  s1: gpaSchema,
  s2: gpaSchema,
  s3: gpaSchema,
  s4: gpaSchema,
  s5: gpaSchema,
  s6: gpaSchema,
  s7: gpaSchema,
  s8: gpaSchema
});

const saveSchema = z.object({
  department: z.string().min(1, 'Department is required'),
  data: z.array(studentResultSchema)
});

function validateBody(schema, body) {
  try {
    const data = schema.parse(body);
    return { success: true, data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ')
      };
    }
    return { success: false, error: 'Unknown validation error' };
  }
}

module.exports = {
  loginSchema,
  extractSchema,
  saveSchema,
  validateBody
};
