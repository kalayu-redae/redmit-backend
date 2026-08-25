import { User } from "../generated/prisma/client.js";
import { UserRole } from "../generated/prisma/client.js";

declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                email: string;
                phone: string;
                username: string;
                fullName: string | null;
                avatarFileId: string | null;
                role: UserRole;
                isVerified: boolean;
                isActive: boolean;
            };
        }
    }
}

export { };

// declare global {
//     namespace Express {
//         interface Request {
//             user?: User;
//         }
//     }
// }

// export { };