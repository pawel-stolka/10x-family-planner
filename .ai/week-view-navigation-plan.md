# Plan Implementacji: Nawigacja i Ładowanie Harmonogramu

## 🔍 Analiza Obecnej Sytuacji

### ✅ Co Działa:
1. **Nawigacja między tygodniami** - przyciski "Poprzedni", "Dzisiaj", "Następny" działają
2. **Ładowanie harmonogramu** - `loadWeekData()` wywołuje API
3. **Week date initialization** - ustawia się na poniedziałek bieżącego tygodnia

### ❌ Problemy:
1. **Week date nie jest w URL** - nie można bookmarkować konkretnego tygodnia
2. **Week date nie jest synchronizowana z URL** - back/forward browser nie działa
3. **Family members nie są ładowane z odpowiedzi schedule** - tylko osobne API call
4. **Brak automatycznego reload** - zmiana `weekStartDate` nie wywołuje automatycznie `loadWeekData()`
5. **Brak obsługi query params** - nie można otworzyć konkretnego tygodnia z URL

---

## 📋 Plan Implementacji

### **KROK 1: Dodanie Query Params do URL**

**Cel:** Synchronizacja tygodnia z URL (`/schedule/week?week=2026-01-13`)

**Zmiany:**
1. Import `ActivatedRoute` i `Router` w `WeekViewContainerComponent`
2. W `ngOnInit()` - odczytaj `week` z query params
3. Jeśli istnieje - użyj tej daty, jeśli nie - użyj bieżącego poniedziałku
4. Przy nawigacji - aktualizuj URL z nową datą

**Kod:**
```typescript
// W ngOnInit()
const weekParam = this.route.snapshot.queryParamMap.get('week');
if (weekParam) {
  const parsedDate = parseISODate(weekParam);
  if (!isNaN(parsedDate.getTime())) {
    this.weekStartDate.set(getMonday(parsedDate));
  }
}

// W loadPreviousWeek(), loadNextWeek(), loadCurrentWeek()
this.router.navigate([], {
  relativeTo: this.route,
  queryParams: { week: formatISODate(this.weekStartDate()) },
  queryParamsHandling: 'merge',
});
```

---

### **KROK 2: Automatyczne Ładowanie przy Zmianie Tygodnia**

**Cel:** Gdy zmienia się `weekStartDate`, automatycznie załaduj dane

**Zmiany:**
1. Użyj `effect()` do obserwowania zmian `weekStartDate`
2. Gdy się zmienia - wywołaj `loadWeekData()`
3. Usuń ręczne wywołania `loadWeekData()` z metod nawigacji

**Kod:**
```typescript
constructor() {
  // Automatyczne ładowanie przy zmianie tygodnia
  effect(() => {
    const weekStart = this.weekStartDate();
    // Skip initial load (ngOnInit will handle it)
    if (weekStart) {
      this.loadWeekData();
    }
  });
}
```

---

### **KROK 3: Ładowanie Family Members z Odpowiedzi Schedule**

**Cel:** Backend zwraca members w odpowiedzi, użyj ich zamiast osobnego API call

**Zmiany:**
1. Zaktualizuj `WeekScheduleService.getWeekSchedule()` aby zwracał members z odpowiedzi
2. W `loadWeekData()` - użyj members z odpowiedzi schedule
3. Usuń lub uprość `loadFamilyMembers()` (może być fallback)

**Kod:**
```typescript
// W WeekScheduleService
getWeekSchedule(weekStartDate: string): Observable<WeekScheduleResponse> {
  return this.http.get<WeeklyScheduleDto[]>(...)
    .pipe(
      map((schedules) => {
        if (schedules && schedules.length > 0) {
          const schedule = schedules[0];
          return {
            weekStart: weekStartDate,
            weekEnd: this.calculateWeekEnd(weekStartDate),
            timeBlocks: schedule.timeBlocks || [],
            members: schedule.members || [], // ← Z odpowiedzi!
          };
        }
        return { /* empty */ };
      })
    );
}
```

---

### **KROK 4: Obsługa Back/Forward Browser**

**Cel:** Gdy użytkownik używa back/forward, zaktualizuj widok

**Zmiany:**
1. Subskrybuj `route.queryParams` w `ngOnInit()`
2. Gdy zmienia się `week` param - zaktualizuj `weekStartDate`
3. Effect automatycznie załaduje dane

**Kod:**
```typescript
ngOnInit(): void {
  // Read initial week from URL
  this.initializeWeekFromUrl();
  
  // Subscribe to URL changes (back/forward)
  this.route.queryParams.subscribe((params) => {
    const weekParam = params['week'];
    if (weekParam) {
      const parsedDate = parseISODate(weekParam);
      if (!isNaN(parsedDate.getTime())) {
        const monday = getMonday(parsedDate);
        // Only update if different to avoid loops
        if (formatISODate(this.weekStartDate()) !== formatISODate(monday)) {
          this.weekStartDate.set(monday);
        }
      }
    }
  });
  
  // Load initial data
  this.loadWeekData();
  this.loadFamilyMembers(); // Fallback if not in schedule response
}
```

---

### **KROK 5: Poprawa Obsługi Błędów**

**Cel:** Lepsze komunikaty gdy harmonogram nie istnieje

**Zmiany:**
1. 404 nie powinien być błędem - to normalny stan (brak harmonogramu)
2. Tylko prawdziwe błędy (500, network) powinny pokazywać error state
3. 404 = empty state z przyciskiem "Generuj"

**Kod:**
```typescript
async loadWeekData(): Promise<void> {
  this.isLoading.set(true);
  this.hasError.set(false);

  try {
    const response = await this.scheduleService.getWeekSchedule(...);
    
    if (response) {
      this.rawScheduleData.set(response.timeBlocks);
      this.scheduleExists.set(response.timeBlocks.length > 0);
      
      // Use members from response if available
      if (response.members && response.members.length > 0) {
        this.familyMembers.set(
          this.transformToViewModels(response.members)
        );
      }
    }
  } catch (error) {
    // Only show error for real failures, not 404
    if (error.status !== 404) {
      this.handleError(error);
    } else {
      // 404 = no schedule, show empty state
      this.rawScheduleData.set([]);
      this.scheduleExists.set(false);
    }
  } finally {
    this.isLoading.set(false);
  }
}
```

---

## 🎯 Szczegółowy Plan Implementacji

### **Plik 1: `week-view-container.component.ts`**

#### Zmiany:

1. **Import Router i ActivatedRoute:**
```typescript
import { Router, ActivatedRoute } from '@angular/router';
```

2. **Inject services:**
```typescript
private readonly router = inject(Router);
private readonly route = inject(ActivatedRoute);
```

3. **Dodaj effect() dla automatycznego ładowania:**
```typescript
constructor() {
  // Auto-load when week changes
  effect(() => {
    const weekStart = this.weekStartDate();
    if (weekStart) {
      // Debounce to avoid multiple calls
      setTimeout(() => this.loadWeekData(), 0);
    }
  });
}
```

4. **Zaktualizuj ngOnInit():**
```typescript
ngOnInit(): void {
  // 1. Initialize week from URL or current date
  this.initializeWeekFromUrl();
  
  // 2. Subscribe to URL changes (back/forward)
  this.subscribeToUrlChanges();
  
  // 3. Load initial data
  this.loadWeekData();
  this.loadFamilyMembers(); // Fallback
}
```

5. **Dodaj metody pomocnicze:**
```typescript
private initializeWeekFromUrl(): void {
  const weekParam = this.route.snapshot.queryParamMap.get('week');
  if (weekParam) {
    const parsedDate = parseISODate(weekParam);
    if (!isNaN(parsedDate.getTime())) {
      this.weekStartDate.set(getMonday(parsedDate));
      return;
    }
  }
  // Default: current week Monday
  this.weekStartDate.set(getMonday(new Date()));
  
  // Update URL with default
  this.updateUrl();
}

private subscribeToUrlChanges(): void {
  this.route.queryParams.subscribe((params) => {
    const weekParam = params['week'];
    if (weekParam) {
      const parsedDate = parseISODate(weekParam);
      if (!isNaN(parsedDate.getTime())) {
        const monday = getMonday(parsedDate);
        const currentWeek = formatISODate(this.weekStartDate());
        const newWeek = formatISODate(monday);
        
        // Only update if different to avoid loops
        if (currentWeek !== newWeek) {
          this.weekStartDate.set(monday);
        }
      }
    }
  });
}

private updateUrl(): void {
  this.router.navigate([], {
    relativeTo: this.route,
    queryParams: { week: formatISODate(this.weekStartDate()) },
    queryParamsHandling: 'merge',
    replaceUrl: true, // Don't add to history for programmatic changes
  });
}
```

6. **Zaktualizuj metody nawigacji:**
```typescript
loadPreviousWeek(): void {
  const currentStart = this.weekStartDate();
  this.weekStartDate.set(addDays(currentStart, -7));
  this.updateUrl();
  // loadWeekData() will be called by effect()
}

loadCurrentWeek(): void {
  this.weekStartDate.set(getMonday(new Date()));
  this.updateUrl();
}

loadNextWeek(): void {
  const currentStart = this.weekStartDate();
  this.weekStartDate.set(addDays(currentStart, 7));
  this.updateUrl();
}
```

7. **Zaktualizuj loadWeekData():**
```typescript
async loadWeekData(): Promise<void> {
  this.isLoading.set(true);
  this.hasError.set(false);

  try {
    const weekStartISO = formatISODate(this.weekStartDate());
    const response = await this.scheduleService
      .getWeekSchedule(weekStartISO)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          // 404 is not an error - just no schedule exists
          if (error.status === 404) {
            return of({
              weekStart: weekStartISO,
              weekEnd: this.calculateWeekEnd(weekStartISO),
              timeBlocks: [],
              members: [],
            });
          }
          this.handleError(error);
          return of(null);
        })
      )
      .toPromise();

    if (response) {
      this.rawScheduleData.set(response.timeBlocks);
      this.scheduleExists.set(response.timeBlocks.length > 0);
      
      // Use members from schedule response if available
      if (response.members && response.members.length > 0) {
        this.familyMembers.set(
          this.transformToViewModels(response.members)
        );
      }
    }
  } catch (error) {
    // Only handle real errors (not 404)
    if (error instanceof HttpErrorResponse && error.status !== 404) {
      this.handleError(error);
    }
  } finally {
    this.isLoading.set(false);
  }
}
```

---

### **Plik 2: `week-schedule.service.ts`**

#### Zmiany:

1. **Zaktualizuj getWeekSchedule() aby zwracał members:**
```typescript
getWeekSchedule(weekStartDate: string): Observable<WeekScheduleResponse> {
  return this.http
    .get<WeeklyScheduleDto[]>(
      `${this.apiUrl}/weekly-schedules`,
      { params: { weekStartDate } }
    )
    .pipe(
      map((schedules) => {
        const weekEnd = this.calculateWeekEnd(weekStartDate);
        
        if (schedules && schedules.length > 0) {
          const schedule = schedules[0];
          
          // Extract members from schedule response
          // Backend should return members in the response
          const members = schedule.members || [];
          
          return {
            weekStart: weekStartDate,
            weekEnd,
            timeBlocks: schedule.timeBlocks || [],
            members, // ← Include members!
          };
        }
        
        // No schedule found
        return {
          weekStart: weekStartDate,
          weekEnd,
          timeBlocks: [],
          members: [], // Empty but present
        };
      })
    );
}
```

---

### **Plik 3: Backend - Zwracanie Members w Odpowiedzi**

**UWAGA:** Backend musi zwracać members w odpowiedzi `GET /api/v1/weekly-schedules`

**Zmiany w `schedule.controller.ts` lub `schedule.mapper.ts`:**

Sprawdź czy `WeeklyScheduleDto` zawiera `members`. Jeśli nie - dodaj.

---

## 📊 Flow Diagram

### **Scenariusz 1: Otwarcie Widoku (Pierwszy Raz)**

```
1. User opens /schedule/week
   ↓
2. ngOnInit() → initializeWeekFromUrl()
   - No 'week' param in URL
   - Set weekStartDate = getMonday(today)
   - Update URL: /schedule/week?week=2026-01-13
   ↓
3. effect() detects weekStartDate change
   ↓
4. loadWeekData() called
   - GET /api/v1/weekly-schedules?weekStartDate=2026-01-13
   - Response: { timeBlocks: [...], members: [...] }
   ↓
5. Update signals:
   - rawScheduleData.set(timeBlocks)
   - familyMembers.set(members)
   - scheduleExists.set(timeBlocks.length > 0)
   ↓
6. UI renders:
   - If timeBlocks.length > 0 → Show grid
   - If timeBlocks.length === 0 → Show empty state
```

### **Scenariusz 2: Nawigacja do Poprzedniego Tygodnia**

```
1. User clicks "Poprzedni"
   ↓
2. loadPreviousWeek() called
   - weekStartDate.set(addDays(current, -7))
   - updateUrl() → /schedule/week?week=2026-01-06
   ↓
3. effect() detects weekStartDate change
   ↓
4. loadWeekData() called automatically
   - GET /api/v1/weekly-schedules?weekStartDate=2026-01-06
   ↓
5. Update UI with new week data
```

### **Scenariusz 3: Back/Forward Browser**

```
1. User clicks browser back button
   ↓
2. URL changes: /schedule/week?week=2026-01-06
   ↓
3. route.queryParams subscription fires
   ↓
4. Parse 'week' param → update weekStartDate
   ↓
5. effect() detects change
   ↓
6. loadWeekData() called automatically
   ↓
7. UI updates with previous week
```

---

## ✅ Checklist Implementacji

### **KROK 1: URL Synchronization**
- [ ] Import Router, ActivatedRoute
- [ ] initializeWeekFromUrl() method
- [ ] subscribeToUrlChanges() method
- [ ] updateUrl() method
- [ ] Update navigation methods to use updateUrl()

### **KROK 2: Auto-loading**
- [ ] Add effect() in constructor
- [ ] Remove manual loadWeekData() calls from navigation
- [ ] Test that data loads automatically

### **KROK 3: Members from Response**
- [ ] Update WeekScheduleService.getWeekSchedule()
- [ ] Update loadWeekData() to use members from response
- [ ] Keep loadFamilyMembers() as fallback

### **KROK 4: Error Handling**
- [ ] Don't treat 404 as error
- [ ] Show empty state for 404
- [ ] Only show error for real failures (500, network)

### **KROK 5: Testing**
- [ ] Test initial load (no param)
- [ ] Test with week param in URL
- [ ] Test navigation (prev/next/today)
- [ ] Test browser back/forward
- [ ] Test bookmarking URL
- [ ] Test empty state
- [ ] Test error state

---

## 🚀 Kolejność Implementacji

1. **Najpierw:** KROK 1 (URL sync) - podstawowa funkcjonalność
2. **Potem:** KROK 2 (auto-loading) - ulepszenie UX
3. **Następnie:** KROK 3 (members from response) - optymalizacja
4. **Na końcu:** KROK 4 (error handling) - polish

---

## 📝 Uwagi

### **Effect() Debouncing:**
Effect może wywołać loadWeekData() wielokrotnie. Rozważ debouncing:

```typescript
private loadTimeout?: ReturnType<typeof setTimeout>;

constructor() {
  effect(() => {
    const weekStart = this.weekStartDate();
    if (weekStart) {
      if (this.loadTimeout) {
        clearTimeout(this.loadTimeout);
      }
      this.loadTimeout = setTimeout(() => {
        this.loadWeekData();
      }, 100); // 100ms debounce
    }
  });
}
```

### **URL History:**
Używamy `replaceUrl: true` dla programmatycznych zmian (nawigacja przyciskami), ale normalne URL changes (back/forward) będą dodawać do historii.

### **Backend Response:**
Upewnij się że backend zwraca `members` w odpowiedzi `GET /api/v1/weekly-schedules`. Jeśli nie - trzeba to dodać w backend.

---

## 🎯 Oczekiwany Rezultat

Po implementacji:

✅ **URL zawiera tydzień:** `/schedule/week?week=2026-01-13`
✅ **Bookmarking działa:** Można zapisać link do konkretnego tygodnia
✅ **Back/Forward działa:** Browser navigation aktualizuje widok
✅ **Auto-loading:** Zmiana tygodnia automatycznie ładuje dane
✅ **Members z response:** Nie potrzeba osobnego API call
✅ **Lepsze error handling:** 404 = empty state, nie error

---

**Gotowy do implementacji!** 🚀
