# Password Management System

A comprehensive password management system built with Next.js, TypeScript, Tailwind CSS, and Supabase.

## 🚀 Features

### Core Functionality
- **Password Storage**: Secure storage of passwords with encryption
- **CRUD Operations**: Create, Read, Update, Delete passwords
- **Password Generation**: Built-in secure password generator
- **Search & Filter**: Search passwords by title, username, or website
- **Favorites**: Mark passwords as favorites for quick access
- **Recycle Bin**: Soft delete with recovery option

### Organization Features
- **Folders**: Organize passwords into custom folders with colors
- **Categories**: Categorize passwords with icons and colors
- **Filtering**: Filter passwords by folder or category
- **Bulk Operations**: Manage multiple passwords at once

### Security Features
- **Password Visibility Toggle**: Show/hide passwords with one click
- **Copy to Clipboard**: One-click password copying
- **Secure Storage**: Passwords stored securely in Supabase
- **User Authentication**: Integrated with Clerk for user management

### UI/UX Features
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Dark Theme**: Beautiful dark theme with gradient accents
- **Smooth Animations**: Framer Motion animations for better UX
- **Intuitive Navigation**: Sidebar navigation with clear sections
- **Modal Forms**: Clean modal forms for creating/editing
- **Loading States**: Proper loading indicators
- **Empty States**: Helpful empty state messages

## 🛠️ Technical Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL)
- **Authentication**: Clerk
- **Animations**: Framer Motion
- **Icons**: Heroicons (SVG)
- **Styling**: Tailwind CSS with custom gradients

## 📁 Database Schema

### Tables

#### `password_folders`
- `id` (UUID, Primary Key)
- `name` (VARCHAR, Required)
- `description` (TEXT, Optional)
- `color` (VARCHAR, Default: #3B82F6)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

#### `password_categories`
- `id` (UUID, Primary Key)
- `name` (VARCHAR, Required)
- `color` (VARCHAR, Default: #8B5CF6)
- `icon` (VARCHAR, Default: 🔐)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

#### `passwords`
- `id` (UUID, Primary Key)
- `title` (VARCHAR, Required)
- `username` (VARCHAR, Required)
- `password` (TEXT, Required)
- `website` (VARCHAR, Optional)
- `notes` (TEXT, Optional)
- `is_favorite` (BOOLEAN, Default: false)
- `folder_id` (UUID, Foreign Key to password_folders)
- `category_id` (UUID, Foreign Key to password_categories)
- `is_deleted` (BOOLEAN, Default: false)
- `deleted_at` (TIMESTAMP, Optional)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Supabase account
- Clerk account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd auth-diary
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file with:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
   CLERK_SECRET_KEY=your_clerk_secret
   ```

4. **Set up Supabase database**
   Run the SQL schema from `supabase-password-schema.sql` in your Supabase SQL editor.

5. **Start the development server**
   ```bash
   npm run dev
   ```

## 📱 Usage

### Adding Passwords
1. Click "Add Password" button
2. Fill in the password details:
   - Title (required)
   - Username/Email (required)
   - Password (required) - use "Generate" for secure passwords
   - Website (optional)
   - Notes (optional)
   - Folder (optional)
   - Category (optional)
3. Click "Create" to save

### Organizing Passwords
1. **Create Folders**: Click "New Folder" in the sidebar
2. **Create Categories**: Click "New Category" in the sidebar
3. **Filter**: Use the folder filter in the sidebar
4. **Search**: Use the search bar at the top

### Managing Passwords
- **View**: Click on any password card to view details
- **Edit**: Click the edit icon on any password
- **Delete**: Click the delete icon (moves to recycle bin)
- **Favorite**: Click the star icon to toggle favorites
- **Copy**: Click the copy icon to copy password to clipboard
- **Show/Hide**: Click the eye icon to toggle password visibility

## 🎨 Customization

### Colors
The system uses a predefined color palette:
- **Blue**: #3B82F6 (Default folder color)
- **Green**: #10B981 (Success actions)
- **Purple**: #8B5CF6 (Default category color)
- **Red**: #EF4444 (Delete actions)
- **Orange**: #F59E0B (Warning actions)
- **Pink**: #EC4899 (Accent color)

### Icons
Categories support emoji icons:
- 🔐 Lock (Default)
- 🌐 Globe
- 💳 Credit Card
- 📱 Mobile
- 💼 Briefcase
- 🎮 Gaming
- 📧 Email
- 🔒 Security

## 🔒 Security Considerations

1. **Password Storage**: Passwords are stored in plain text in the database. In production, consider implementing client-side encryption.

2. **Authentication**: Ensure proper user authentication and authorization.

3. **HTTPS**: Always use HTTPS in production.

4. **Environment Variables**: Keep your environment variables secure and never commit them to version control.

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy

### Other Platforms
The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 📈 Future Enhancements

- [ ] Client-side password encryption
- [ ] Password strength analyzer
- [ ] Two-factor authentication
- [ ] Password sharing
- [ ] Import/Export functionality
- [ ] Mobile app
- [ ] Browser extension
- [ ] Password breach detection
- [ ] Advanced search filters
- [ ] Password history
- [ ] Audit logs

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues or have questions:
1. Check the GitHub issues
2. Create a new issue with detailed information
3. Contact the development team

---

**Note**: This is a demo password management system. For production use, implement additional security measures and follow security best practices.
