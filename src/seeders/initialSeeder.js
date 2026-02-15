// import mongoose from "mongoose";
// import bcrypt from "bcryptjs";



// import UserModel from "../models/User.model.js";
// import { MODULE_KEY, USER_ROLE } from "../constants/enums.js";
// import ModulePermissionModel from "../models/ModulePermission.model.js";
// import ModuleModel from "../models/Module.model.js";

// // 🔐 CONFIG (env me rakho)
// const SUPER_ADMIN_DATA = {
//   fullName: "Super Admin",
//   mobile: "9999999999",
//   email: "admin@system.com",
//   password: "Admin@123" // first login ke baad change karwana
// };

// export const runInitialSeeder = async () => {
//   console.log("🌱 Running Initial Seeder...");

//   /* --------------------------------------------------
//    1️⃣ SUPER ADMIN CREATE (ONLY ONE)
//   -------------------------------------------------- */
//   let superAdmin = await UserModel.findOne({
//     roles: USER_ROLE.SUPER_ADMIN
//   });

//   if (!superAdmin) {
//     const passwordHash = await bcrypt.hash(
//       SUPER_ADMIN_DATA.password,
//       12
//     );

//     superAdmin = await UserModel.create({
//       fullName: SUPER_ADMIN_DATA.fullName,
//       mobile: SUPER_ADMIN_DATA.mobile,
//       email: SUPER_ADMIN_DATA.email,
//       passwordHash,
//       roles: [USER_ROLE.SUPER_ADMIN],
//       isBlocked: false
//     });

//     console.log("✅ Super Admin created");
//   } else {
//     console.log("ℹ️ Super Admin already exists");
//   }

//   /* --------------------------------------------------
//    2️⃣ MODULE SEEDER (ENUM → DB)
//   -------------------------------------------------- */
//   const moduleKeys = Object.values(MODULE_KEY);

//   for (const key of moduleKeys) {
//     await ModuleModel.updateOne(
//       { moduleKey: key },
//       {
//         $setOnInsert: {
//           moduleKey: key,
//           displayName: key.replace(/_/g, " "),
//           description: `${key} management module`,
//           isActive: true,
//           createdBy: superAdmin._id
//         }
//       },
//       { upsert: true }
//     );
//   }



//   // console.log("✅ Modules synced from enum");

//   /* --------------------------------------------------
//    3️⃣ SUPER ADMIN FULL PERMISSION
//   -------------------------------------------------- */
//   for (const key of moduleKeys) {
//     await ModulePermissionModel.updateOne(
//       {
//         role: USER_ROLE.SUPER_ADMIN,
//         moduleKey: key
//       },
//       {
//         $set: {
//           permissions: {
//             create: true,
//             read: true,
//             update: true,
//             delete: true
//           }
//         }
//       },
//       { upsert: true }
//     );
//   }

//   // console.log("✅ Super Admin permissions granted");

//   console.log("🎉 Initial Seeder Completed");
// };



import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import RoleModel from "../models/Role.model.js";
import UserModel from "../models/User.model.js";
import ModuleModel from "../models/Module.model.js";
import ModulePermissionModel from "../models/ModulePermission.model.js";

import { USER_ROLE, MODULE_KEY } from "../constants/enums.js";

// 🔐 SUPER ADMIN DEFAULT DATA
const SUPER_ADMIN_DATA = {
  fullName: "Super Admin",
  mobile: "9999999999",
  email: "admin@system.com",
  password: "Admin@123" // login ke baad change karwana
};

export const runInitialSeeder = async () => {
  console.log("🌱 Running Initial Seeder...");

  /* --------------------------------------------------
     1️⃣ CREATE ROLES
  -------------------------------------------------- */
  const roles = Object.values(USER_ROLE);

  const roleDocs = {};
  for (const roleName of roles) {
    let role = await RoleModel.findOne({ name: roleName });
    if (!role) {
      role = await RoleModel.create({ name: roleName, description: `${roleName} role` });
      console.log(`✅ Role created: ${roleName}`);
    } else {
      console.log(`ℹ️ Role already exists: ${roleName}`);
    }
    roleDocs[roleName] = role; // store role document for user assignment
  }

  /* --------------------------------------------------
     2️⃣ CREATE SUPER ADMIN USER
  -------------------------------------------------- */
  let superAdmin = await UserModel.findOne({ mobile: SUPER_ADMIN_DATA.mobile });
  if (!superAdmin) {
    const passwordHash = await bcrypt.hash(SUPER_ADMIN_DATA.password, 12);

    superAdmin = await UserModel.create({
      fullName: SUPER_ADMIN_DATA.fullName,
      mobile: SUPER_ADMIN_DATA.mobile,
      email: SUPER_ADMIN_DATA.email,
      passwordHash,
      roles: [roleDocs[USER_ROLE.SUPER_ADMIN]._id],
      isBlocked: false
    });

    console.log("✅ Super Admin created");
  } else {
    console.log("ℹ️ Super Admin already exists");
  }

  /* --------------------------------------------------
     3️⃣ CREATE MODULES
  -------------------------------------------------- */
  const moduleKeys = Object.values(MODULE_KEY);
  const moduleDocs = {};
  for (const key of moduleKeys) {
    let mod = await ModuleModel.findOne({ moduleKey: key });
    if (!mod) {
      mod = await ModuleModel.create({
        moduleKey: key,
        displayName: key.replace(/_/g, " "),
        description: `${key} management module`,
        createdBy: superAdmin._id
      });
      console.log(`✅ Module created: ${key}`);
    } else {
      console.log(`ℹ️ Module already exists: ${key}`);
    }
    moduleDocs[key] = mod;
  }

  /* --------------------------------------------------
     4️⃣ CREATE MODULE PERMISSIONS
         → SUPER ADMIN → FULL ACCESS
  -------------------------------------------------- */
  for (const key of moduleKeys) {
    const existing = await ModulePermissionModel.findOne({
      role: USER_ROLE.SUPER_ADMIN,
      moduleKey: key
    });

    if (!existing) {
      await ModulePermissionModel.create({
        role: USER_ROLE.SUPER_ADMIN,
        moduleKey: key,
        permissions: { create: true, read: true, update: true, delete: true }
      });
      console.log(`✅ Permission set for SUPER_ADMIN → ${key} (all access)`);
    } else {
      console.log(`ℹ️ Permission already exists for SUPER_ADMIN → ${key}`);
    }
  }

  console.log("🎉 Initial Seeder Completed");
};
