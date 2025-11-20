# User Management Guide

This guide covers all the scripts available for managing users, credits, and passwords in your Sora Video Generator application.

---

## Table of Contents

1. [Creating New Users](#creating-new-users)
2. [Listing Users](#listing-users)
3. [Adding Credits](#adding-credits)
4. [Resetting Passwords](#resetting-passwords)

---

## Creating New Users

Create new user accounts in the database.

### Local Usage

1. **Edit the user creation script:**
   Open `scripts/create-users.ts` and modify the `users` array:

   ```typescript
   const users = [
     {
       username: 'newuser',
       email: 'newuser@example.com',
       password: 'securepassword123', // Change this!
     },
     // Add more users as needed
   ]
   ```

2. **Run the script:**
   ```bash
   npm run create-users
   ```

### Production Usage (Railway)

1. **Edit the script** (same as above)

2. **Commit and push changes:**
   ```bash
   git add scripts/create-users.ts
   git commit -m "Add new users"
   git push
   ```

3. **Run on Railway:**
   ```bash
   npx railway run npm run create-users
   ```

### Expected Output

```
✓ Created/Updated user: newuser (newuser@example.com)
✓ Created/Updated user: anotheruser (anotheruser@example.com)
```

---

## Listing Users

View all users in the database with their usernames, emails, credit balances, and creation dates.

### Local Usage

```bash
npm run list-users
```

### Production Usage (Railway)

```bash
npx railway run npm run list-users
```

### Expected Output

```
📋 Users in Database:

────────────────────────────────────────────────────────────────────────────────
Username             | Email                          | Credits    | Created
────────────────────────────────────────────────────────────────────────────────
siddksur             | siddksur@gmail.com             | 55         | 11/16/2025
Saurabh              | saurabh@thesurgroup.com        | 40         | 11/16/2025
chloetudor           | chloe4tudor@gmail.com          | 0          | 11/17/2025
────────────────────────────────────────────────────────────────────────────────

Total users: 3
```

---

## Adding Credits

Manually add credits to a user's account. Useful for promotions, bonuses, or customer support.

### Local Usage

**By Email:**
```bash
npm run add-credits -- --email user@example.com --credits 20 --description "Promo credits"
```

**By Username:**
```bash
npm run add-credits -- --username myuser --credits 20 --description "Promo credits"
```

### Production Usage (Railway)

**By Email:**
```bash
npx railway run npm run add-credits -- --email user@example.com --credits 20 --description "Promo credits"
```

**By Username:**
```bash
npx railway run npm run add-credits -- --username myuser --credits 20 --description "Promo credits"
```

### Parameters

- `--email` or `--username`: User identifier (one is required)
- `--credits`: Number of credits to add (required, must be positive)
- `--description`: Optional description for the credit history (defaults to "Manually added X credits")

### Expected Output

```
Found user: siddksur (siddksur@gmail.com)
Current balance: 15 credits
Adding: 20 credits
✓ Successfully added 20 credits
New balance: 35 credits
```

### Examples

**Promotional Credits:**
```bash
npx railway run npm run add-credits -- --email customer@example.com --credits 20 --description "Promotional credits - Special offer"
```

**Welcome Bonus:**
```bash
npx railway run npm run add-credits -- --email newuser@example.com --credits 10 --description "Welcome bonus"
```

**Customer Support:**
```bash
npx railway run npm run add-credits -- --email support@example.com --credits 5 --description "Compensation for service issue"
```

### Notes

- Credits are added immediately to the user's balance
- A credit history entry is created for audit purposes
- The transaction type is recorded as "purchase" in the credit history

---

## Resetting Passwords

Reset a user's password. Passwords are hashed and cannot be recovered, so this is the only way to change them.

### Local Usage

**By Email:**
```bash
npm run reset-password -- --email user@example.com --password newpassword123
```

**By Username:**
```bash
npm run reset-password -- --username myuser --password newpassword123
```

### Production Usage (Railway)

**By Email:**
```bash
npx railway run npm run reset-password -- --email user@example.com --password newpassword123
```

**By Username:**
```bash
npx railway run npm run reset-password -- --username myuser --password newpassword123
```

### Parameters

- `--email` or `--username`: User identifier (one is required)
- `--password`: New password (required, minimum 6 characters)

### Expected Output

```
Found user: siddksur (siddksur@gmail.com)
Resetting password...
✓ Successfully reset password for siddksur
New password: newpassword123

⚠️  IMPORTANT: Share this password securely with the user!
```

### Security Notes

- Passwords are hashed using bcrypt with 12 rounds
- Minimum password length is 6 characters
- The script displays the new password - share it securely with the user
- Consider requiring users to change their password after first login

### Example Workflow

```bash
# 1. User requests password reset
# 2. Generate a secure temporary password
npx railway run npm run reset-password -- --email user@example.com --password TempPass2024!

# 3. Share the password securely with the user
# 4. Recommend they change it after logging in
```

---

## Quick Reference

### All Commands Summary

| Action | Local Command | Railway Command |
|--------|--------------|----------------|
| **List Users** | `npm run list-users` | `npx railway run npm run list-users` |
| **Add Credits** | `npm run add-credits -- --email X --credits Y` | `npx railway run npm run add-credits -- --email X --credits Y` |
| **Reset Password** | `npm run reset-password -- --email X --password Y` | `npx railway run npm run reset-password -- --email X --password Y` |
| **Create Users** | `npm run create-users` | `npx railway run npm run create-users` |

---

## Common Workflows

### Customer Support: Adding Credits

```bash
# 1. Find the user
npx railway run npm run list-users

# 2. Add credits
npx railway run npm run add-credits -- --email customer@example.com --credits 20 --description "Compensation for issue #123"
```

### Customer Support: Password Reset

```bash
# 1. Find the user
npx railway run npm run list-users

# 2. Reset password
npx railway run npm run reset-password -- --email customer@example.com --password TempPass123

# 3. Share password securely with customer
```

### Promotional Campaign

```bash
# Add credits to multiple users
npx railway run npm run add-credits -- --email user1@example.com --credits 20 --description "Promo campaign - 20 free credits"
npx railway run npm run add-credits -- --email user2@example.com --credits 20 --description "Promo campaign - 20 free credits"
npx railway run npm run add-credits -- --email user3@example.com --credits 20 --description "Promo campaign - 20 free credits"
```

---

## Troubleshooting

### Error: "User not found"

- Verify the email/username is correct using `list-users`
- Check for typos in the email address
- Ensure the user exists in the database

### Error: "Missing script"

- Make sure you've pushed the latest changes to git
- Wait a few moments for Railway to deploy
- Verify the script exists in `scripts/` directory

### Error: "Permission denied" (Railway CLI)

- Use `npx railway` instead of `railway` if CLI isn't installed globally
- Ensure you're logged in: `npx railway login`
- Verify project is linked: `npx railway link`

### Error: Database connection issues

- Check that `DATABASE_URL` is set correctly in Railway
- Verify the database service is running
- Check Railway logs for connection errors

---

## Security Best Practices

1. **Passwords:**
   - Always use strong, unique passwords
   - Share passwords securely (use encrypted channels)
   - Encourage users to change temporary passwords

2. **Credits:**
   - Always include a description explaining why credits were added
   - Review credit history regularly for audit purposes
   - Be cautious when adding large credit amounts

3. **Access:**
   - Limit who has access to these scripts
   - Use Railway CLI only from secure machines
   - Never commit passwords or sensitive data to git

---

## Additional Resources

- **Prisma Studio**: Visual database browser
  - Local: `npm run db:studio`
  - Railway: `npx railway run npm run db:studio`

- **Database Schema**: See `prisma/schema.prisma` for data models

- **Scripts Location**: All scripts are in the `scripts/` directory

---

## Support

If you encounter issues:

1. Check the error message carefully
2. Verify user exists using `list-users`
3. Check Railway logs: `npx railway logs`
4. Review the script files in `scripts/` directory



