import { defineConfig ,env} from "@prisma/config";
import 'dotenv/config';

const DATABASE_URL = env('DATABASE_URL');
export default defineConfig({
  datasource: {
    url: DATABASE_URL!,
  },
});
