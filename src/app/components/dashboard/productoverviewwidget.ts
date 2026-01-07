import { Component, computed, inject, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { RatingModule } from 'primeng/rating';
import { LayoutService } from '../../service/layout.service';
import { Observable, of, delay } from 'rxjs';

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
}
@Component({
  selector: 'product-overview-widget',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    FormsModule,
    TableModule,
    TagModule,
    RatingModule,
  ],
  template: `
    <div
      class="bg-surface-0 dark:bg-surface-900 p-6 rounded-xl border border-surface-200 dark:border-surface-700 flex flex-col gap-4"
    >
      <div
        class="flex sm:items-center justify-between mb-4 sm:flex-row flex-col gap-2"
      >
        <span class="font-medium text-base">Products Overview</span>
        <p-iconfield class="sm:w-auto w-full">
          <p-inputicon class="pi pi-search" />
          <input
            pInputText
            [(ngModel)]="searchQuery"
            placeholder="Search products..."
            class="p-inputtext-sm md:w-auto! w-full!"
            (ngModelChange)="searchProducts()"
          />
        </p-iconfield>
      </div>
      <div class="flex flex-col gap-2">
      <p-table
        [value]="products()"
        [rows]="pageSize"
        [totalRecords]="totalRecords()"
        selectionMode="single"
        [scrollable]="true"
        [virtualScroll]="true"
        [virtualScrollItemSize]="54"
        scrollHeight="320px"
        [loading]="loading()"
        [lazy]="true"
        [virtualScrollDelay]="0"
        (onLazyLoad)="onLazyLoad($event)"
        styleClass="products-table"
        [ngClass]="{ 'p-dark': isDarkMode() }"
      >
        <ng-template #header>
          <tr>
            <th pSortableColumn="id">Id <p-sortIcon field="id" /></th>
            <th pSortableColumn="name">Name <p-sortIcon field="name" /></th>
            <th pSortableColumn="category">
              Category <p-sortIcon field="category" />
            </th>
              <th pSortableColumn="price">
                Price <p-sortIcon field="price" />
              </th>
            <th pSortableColumn="status">
              Status <p-sortIcon field="status" />
            </th>
          </tr>
        </ng-template>
        <ng-template #body let-product>
          <tr>
            <td>{{ product.id }}</td>
            <td>{{ product.name }}</td>
            <td>{{ product.category }}</td>
            <td>{{ product.price }}</td>
            <td>
              <p-tag
                [severity]="
                  product.status === 'In Stock'
                    ? 'success'
                    : product.status === 'Low Stock'
                    ? 'warn'
                    : 'danger'
                "
              >
                {{ product.status }}
              </p-tag>
            </td>
          </tr>
        </ng-template>
        </p-table>
      </div>
    </div>
  `
})
export class ProductOverviewWidget {
  layoutService = inject(LayoutService);

  isDarkMode = computed(() => this.layoutService.appState().darkMode);

 
private allProducts: Product[] = this.buildMockData(50);

  private buildMockData(count: number): Product[] {
    const categories = ['Electronics', 'Accessories', 'Home', 'Gaming', 'Office'];
    const names = [
      'Laptop Pro', 'Wireless Mouse', 'Monitor 4K', 'Keyboard', 'USB-C Hub',
      'Noise-Canceling Headphones', 'Smartphone XL', 'Gaming Chair', 'Webcam HD',
      'Portable SSD', 'Mechanical Keyboard', 'Bluetooth Speaker', 'Ergonomic Mouse',
      'Router WiFi 6', '4K Projector', 'Laser Printer', 'Desk Lamp', 'Graphics Tablet',
      'VR Headset', 'Microphone Pro', 'HDMI Cable', 'Docking Station', 'Wireless Charger',
      'Smartwatch', 'Action Camera', 'NAS Server', 'Portable Monitor', 'Drawing Tablet',
      'Trackpad', 'Stylus Pen', 'Photo Printer', 'Power Bank', 'Smart Plug', 'LED Strip',
      'IP Camera', 'Gaming Monitor', 'Soundbar', 'Keyboard Cover', 'Laptop Stand', 'Mouse Pad',
      'External HDD', 'Card Reader', 'Surge Protector', 'Webcam 4K', 'Earbuds', 'Tripod',
      'Green Screen', 'Capture Card', 'Streaming Light', 'Cable Organizer'
    ];

    const statuses: Product['status'][] = ['In Stock', 'Low Stock', 'Out of Stock'];

    const products: Product[] = [];
    for (let i = 0; i < count; i++) {
      const id = i + 1;
      const name = names[i % names.length] + (i >= names.length ? ` ${id}` : '');
      const category = categories[i % categories.length];
      const base = 20 + (i * 7) % 480; // 20..500
      const price = Math.round((base + (i % 3 === 0 ? 19 : i % 5 === 0 ? 49 : 0)) * 100) / 100;
      const status = statuses[i % statuses.length];

      products.push({ id, name, category, price, status });
    }
    return products;
  }

  
  filteredProducts: any = [];


  protected pageSize: number = 6;
 
  protected selectedProduct?: Product;
  public totalRecords = signal<number>(0);
  public products = signal<Product[]>([]);

  protected readonly searchQuery = signal<string>('');
  protected loading = signal<boolean>(false);

  ngOnInit() {
    this.loadProducts({ first: 0, rows: this.pageSize } as TableLazyLoadEvent);
  }

  protected searchProducts(): void {
    // this.loadProducts();
  }

  protected onLazyLoad(event: TableLazyLoadEvent): void {
    this.loadProducts(event);
  }

  private loadProducts(event: TableLazyLoadEvent): void {
    if (event.rows === 0) return;

    const size = this.pageSize + (this.pageSize * 2);
    const first = Math.max((event.first ?? 0) - this.pageSize, 0);

    this.loading.set(true);

    this.getItems(first, size).subscribe({
      next: (data: any) => {
        const pageItems = data[0] as Product[];
        const total = data[1] as number;

        this.totalRecords.set(total);

        // if (this.totalRecords() !== this.products().length) {
          const products: Product[] = Array.from({ length: total }, () => ({ id: 0 } as Product));
          this.products.set(products);
        // }

        const current = this.products().slice();
        current.splice(first, pageItems.length, ...pageItems);
        this.products.set(current);
        this.loading.set(false);

        console.log("loadProducts", { event, first: event.first, last: event.last });

      },
      error: () => {
        this.products.set([]);
        this.loading.set(false);
      }
    });
  }


  
private getItems(first: number, size: number): Observable<[Product[], number]> {
    const q = (this.searchQuery() || '').trim().toLowerCase();
    let filtered = this.allProducts;

    if (q) {
      filtered = this.allProducts.filter(p => {
        return (
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.status.toLowerCase().includes(q)
        );
      });
    }

    const total = filtered.length;

    // 2) paginazione (clamp degli indici per sicurezza)
    const start = Math.max(0, Math.min(first, Math.max(0, total - 1)));
    const end = Math.max(start, Math.min(start + size, total));

    const pageItems = filtered.slice(start, end);

    // 3) simulazione latenza (es. 350ms)
    return of<[Product[], number]>([pageItems, total]).pipe(delay(350));
  }

}
