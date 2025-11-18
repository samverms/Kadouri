---
sidebar_position: 4
---

# Managing Products

Learn how to create, edit, and manage products in your PACE CRM catalog. Products represent the items you buy and sell, such as Almonds, Walnuts, Raisins, and other agricultural goods.

## Overview

The Products module allows you to:
- Create and manage your product catalog
- Define product variants (different sizes and packaging types)
- Categorize products for easy filtering
- Track product details like variety and grade
- Set default variants for quick order entry
- Search and filter your product list

## Viewing Products

### Accessing the Products List

1. Click **Products** in the left sidebar navigation
2. You'll see a list of all your active products

### Understanding the Products List

The products table shows:
- **Product Name**: The name of the product (e.g., "Almonds")
- **Variety**: The specific variety (e.g., "Nonpareil", "Organic")
- **Grade**: Product grade (e.g., "Premium", "A", "Standard")
- **Category**: Product category (e.g., "Almonds", "Walnuts")
- **Default Variant**: The primary size/packaging option (e.g., "10 lb bag")
- **Active**: Whether the product is active or archived
- **Last Updated**: When the product was last modified (mm/dd/yy format)

### Searching Products

Use the search bar at the top to find products:
- Search by product name
- Search by product code
- Search by variety
- Search by grade

The search is case-insensitive and matches partial text.

### Filtering Products

**By Active Status:**
- Toggle "Show Active Only" to see archived products
- Active products have a green checkmark badge
- Inactive products have a red X badge

**By Category:**
- Use the category dropdown to filter by specific product types
- Options include: Almonds, Walnuts, Pistachios, Raisins, and more

**By Date Range:**
- Click the date range picker to filter products updated within a specific time period
- Preset options: Today, Last 7 days, Last 30 days, Custom range

### Sorting Products

Click any column header to sort:
- Click once to sort ascending (A→Z)
- Click again to sort descending (Z→A)
- The arrow icon indicates current sort direction

### Viewing Product Details

Click on any product row to expand and see:
- **Product Variants**: All available sizes and packaging options
  - Each variant shows: size, unit, and package type (e.g., "10 lb bag")
  - Default variant is highlighted in blue with a "Default" badge
- Full product information in a detailed view

## Creating a New Product

### Step 1: Start Product Creation

1. Click the **New Product** button (top right)
2. You'll be taken to the product creation page

### Step 2: Fill in Product Information

Complete the following fields:

**Product Code** (Optional)
- A unique identifier for the product (e.g., "K1001")
- Leave blank to auto-generate later

**Product Name** (Required)
- The name of the product (e.g., "Almonds")
- This field is mandatory

**Variety** (Optional)
- The specific variety or type (e.g., "Nonpareil", "Organic", "Conventional")

**Grade** (Optional)
- Quality grade (e.g., "Premium", "A", "Standard", "Select")

**Category** (Optional)
- Select from predefined categories:
  - **Nuts**: Almonds, Walnuts, Pecans, Pistachios, Cashews, Hazelnuts, Macadamias, Brazil Nuts, Pine Nuts
  - **Dried Fruits**: Raisins, Dates, Figs, Prunes, Apricots, Cranberries, Cherries
  - **Seeds**: Pumpkin Seeds, Sunflower Seeds, Chia Seeds, Flax Seeds, Sesame Seeds
  - **Fresh Produce**: Apples, Oranges, Grapes, Berries
  - **Other**: For products not in above categories

**Active**
- Check this box to make the product active (default: checked)
- Uncheck to create an inactive/archived product

### Step 3: Save the Product

1. Click **Create Product** button
2. You'll see a success notification
3. You'll be automatically redirected to the edit page

### Step 4: Add Product Variants

After creating a product, you should add at least one variant:

1. On the edit page, scroll to the **Product Variants** section
2. Click **Add Variant**
3. Fill in variant details:
   - **Size**: Numeric value (e.g., 10, 25, 50)
   - **Size Unit**: Unit of measure (lb, oz, kg, g)
   - **Package Type**: Packaging (bag, box, case, pallet)
   - **SKU**: Optional unique identifier for this variant
   - **Default**: Check to make this the default variant
   - **Active**: Variant status
4. Click **Save Variant**

**Best Practice:** Always set one variant as the default. This will be shown in order entry and product lists.

## Editing Products

### Editing Basic Information

1. Navigate to the products list
2. Click on a product to view details
3. Click the **Edit** button
4. Update any of these fields:
   - Product Code
   - Product Name
   - Variety
   - Grade
   - Category
   - Active status
5. Click **Save Changes**

### Managing Variants

On the product edit page, you can:

**Add a New Variant:**
1. Click **Add Variant**
2. Fill in variant details
3. Click **Save Variant**

**Edit an Existing Variant:**
1. Find the variant in the list
2. Click the **Edit** icon (pencil)
3. Update the fields
4. Click **Save**

**Delete a Variant:**
1. Find the variant in the list
2. Click the **Delete** icon (trash)
3. Confirm deletion

:::caution Important
You cannot delete the last active variant. A product must have at least one active variant.
:::

**Set a Different Default Variant:**
1. Edit the variant you want to make default
2. Check the "Default" checkbox
3. Click **Save**
4. The system automatically unsets the previous default

## Product Variants Explained

### What are Variants?

Variants represent different sizes and packaging options for the same product. For example, "Almonds - Nonpareil - Premium" might have these variants:
- 10 lb bag
- 25 lb bag
- 50 lb box
- 2000 lb pallet

### Why Use Variants?

- **Flexible Ordering**: Customers can order different quantities
- **Accurate Pricing**: Each variant can have its own price
- **Better Inventory**: Track stock by size and package type
- **QuickBooks Integration**: Sync multiple options for the same product

### Default Variant

The default variant is:
- Shown in the products list for quick reference
- Pre-selected when creating orders
- The primary packaging option for the product

**Tip:** Set your most commonly sold size as the default.

## Archiving Products

Instead of deleting products, archive them to preserve order history.

### How to Archive a Product

1. Open the product in edit mode
2. Uncheck the **Active** checkbox
3. Click **Save Changes**

### Viewing Archived Products

1. Go to the products list
2. Toggle off "Show Active Only"
3. Archived products appear with a red "Inactive" badge

### Reactivating a Product

1. Find the archived product in the list
2. Click to open it
3. Click **Edit**
4. Check the **Active** checkbox
5. Click **Save Changes**

## Common Workflows

### Adding a New Product Type

**Example: Adding "Pecans"**

1. Click **New Product**
2. Enter:
   - Name: "Pecans"
   - Variety: "Halves"
   - Grade: "Premium"
   - Category: "Pecans"
3. Click **Create Product**
4. Add variants:
   - 10 lb bag (default)
   - 25 lb box
   - 50 lb box
5. Save each variant

### Creating Multiple Varieties

**Example: Almond varieties**

Create separate products for each variety:
- "Almonds - Nonpareil - Premium"
- "Almonds - Nonpareil - Select"
- "Almonds - Carmel - Premium"

Each can have its own variants and pricing.

### Organizing by Category

Use categories to group similar products:
- Filter the list by "Almonds" to see all almond products
- Filter by "Raisins" to see all raisin products
- This makes it easier to find products when creating orders

## Tips and Best Practices

### Product Naming

**Good:**
- "Almonds - Nonpareil - Premium"
- "Walnuts - Light Halves - Extra Fancy"
- "Raisins - Thompson Seedless - Select"

**Avoid:**
- "Alm" (too short, unclear)
- "Product 1" (not descriptive)
- "almonds nonpareil premium" (inconsistent formatting)

### Using Categories

- Assign categories to all products for better organization
- Use the predefined categories when possible
- Select "Other" only for truly unique products

### Managing Variants

- Always set a default variant
- Include commonly sold sizes (10 lb, 25 lb, 50 lb)
- Use consistent unit naming (always "lb" not "LB" or "lbs")
- Archive variants instead of deleting them

### Search Optimization

- Include variety and grade in the product name for easier searching
- Use consistent naming conventions
- Fill in all optional fields (variety, grade, category) for better filtering

## Troubleshooting

### Can't Find a Product

**Solution:**
1. Clear the search box
2. Check if "Show Active Only" is enabled
3. Try searching by product code instead of name
4. Verify the product hasn't been archived

### Default Variant Not Showing

**Solution:**
1. Edit the product
2. Check that at least one variant has "Default" checked
3. If no variant is default, edit one and set it as default
4. Refresh the products list

### Can't Delete a Variant

**Solution:**
- You cannot delete the last active variant
- Archive the variant instead of deleting it, or
- Add a new variant first, then delete the old one

### Changes Not Saving

**Solution:**
1. Check that all required fields are filled (Product Name)
2. Verify you have permission to edit products
3. Check your internet connection
4. Try refreshing the page and editing again
5. Contact your system administrator if the issue persists

## Keyboard Shortcuts

- **Search**: Click in search box or use Tab to navigate
- **Enter**: Submit forms (create/edit)
- **Esc**: Close dialogs and modals
- **Click product row**: Expand/collapse details

## Frequently Asked Questions

**Q: Can I delete a product?**
A: Products use "soft delete" - mark them as inactive instead. This preserves historical order data.

**Q: How many variants can a product have?**
A: There's no hard limit, but we recommend keeping it under 20 for usability.

**Q: Can I change the default variant later?**
A: Yes, edit any variant and set it as default. The system automatically updates.

**Q: What happens to orders if I archive a product?**
A: Historical orders remain unchanged. You just can't create new orders with archived products.

**Q: Can I import products from a spreadsheet?**
A: This feature is planned for a future release. Currently, products must be added manually.

**Q: What's the difference between variety and grade?**
A: Variety refers to the type (e.g., "Nonpareil"), while grade indicates quality (e.g., "Premium"). Both are optional.

**Q: Do I need to create variants?**
A: While not required immediately, variants are needed before creating orders. It's best to add at least one default variant when creating a product.

## Related Topics

- [Creating Orders](/user-guide/creating-orders) - Use products in orders
- [QuickBooks Integration](/features/quickbooks-sync) - Sync products to QuickBooks
- [Managing Accounts](/user-guide/managing-accounts) - Customer and vendor management

## Need Help?

If you have questions or need assistance with product management:
- Contact your system administrator
- Check the FAQ section above
- Review the video tutorials (if available)
- Submit a support ticket
