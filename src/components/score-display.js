import { getAuth } from "firebase/auth";

export class ScoreDisplay {
    constructor(scoreService, authService, notificationManager) {
        console.log("[ScoreDisplay] Inicjalizacja konstruktora");
        this.scoreService = scoreService;
        this.authService = authService;
        this.notificationManager = notificationManager;
        this.initialized = false;
    }

    init() {
        if (this.initialized) {
            console.log("[ScoreDisplay] Już zainicjalizowano");
            return;
        }
        console.log("[ScoreDisplay] Rozpoczęcie inicjalizacji");
        
        try {
            this.setupFilteringAndSorting();
            this.loadScores();
            this.initialized = true;
            console.log("[ScoreDisplay] Inicjalizacja zakończona pomyślnie");
        } catch (error) {
            console.error("[ScoreDisplay] Błąd podczas inicjalizacji:", error);
            this.notificationManager.show('Wystąpił błąd podczas inicjalizacji wyświetlania wyników', 'error');
        }
    }

    setupEventListeners() {
        if (this.scoreForm && !this.initialized) {
            this.scoreForm.removeEventListener('submit', this.boundHandleSubmit);
            this.scoreForm.addEventListener('submit', this.boundHandleSubmit);
        }
    }

    initializeFiltering() {
        // Tutaj możesz dodać logikę do inicjalizacji filtrów
        const filterForm = document.getElementById('filter-form');
        const sortSelect = document.getElementById('sort-select');
    
        if (filterForm) {
            filterForm.reset(); // Resetuje formularz filtrów
        }
    
        if (sortSelect) {
            sortSelect.selectedIndex = 0; // Ustawia domyślną opcję sortowania
        }
    }
    setupFilteringAndSorting() {
        console.log("[ScoreDisplay] Konfiguracja filtrowania i sortowania");
        const filterForm = document.getElementById('filter-form');
        const sortSelect = document.getElementById('sort-select');
    
        if (filterForm) {
            filterForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const filters = {
                    exerciseType: filterForm['filter-exercise'].value,
                    dateFrom: filterForm['filter-date-from'].value,
                    dateTo: filterForm['filter-date-to'].value
                };
                try {
                    const scores = await this.scoreService.getFilteredScores(filters);
                    // Najpierw sortujemy według aktualnie wybranej opcji
                    const sortedScores = this.sortScores(scores, sortSelect.value);
                    // Następnie odświeżamy widok
                    this.displayScores(sortedScores);
                } catch (error) {
                    console.error('Error filtering scores:', error);
                    this.notificationManager.show('Błąd podczas filtrowania wyników', 'error');
                }
            });
        }
    
        if (sortSelect) {
            sortSelect.addEventListener('change', async () => {
                try {
                    // Pobierz świeże dane
                    let scores = await this.scoreService.loadScores();
                    console.log("Pobrane wyniki przed sortowaniem:", scores);
    
                    // Zastosuj aktualne filtry, jeśli są
                    if (filterForm) {
                        const filters = {
                            exerciseType: filterForm['filter-exercise'].value,
                            dateFrom: filterForm['filter-date-from'].value,
                            dateTo: filterForm['filter-date-to'].value
                        };
                        if (filters.exerciseType || filters.dateFrom || filters.dateTo) {
                            scores = await this.scoreService.getFilteredScores(filters);
                        }
                    }
    
                    // Sortuj wyniki
                    const sortedScores = this.sortScores(scores, sortSelect.value);
                    console.log("Po sortowaniu:", sortedScores);
    
                    // Wyczyść kontener i wyświetl posortowane wyniki
                    const scoresContainer = document.querySelector('.scores-list-container');
                    if (scoresContainer) {
                        scoresContainer.innerHTML = '';
                    }
                    
                    // Odśwież wyświetlanie
                    this.displayScores(sortedScores);
                    
                    // Opcjonalnie: pokaż powiadomienie o pomyślnym sortowaniu
                    this.notificationManager.show('Wyniki zostały posortowane', 'success');
    
                } catch (error) {
                    console.error('Error sorting scores:', error);
                    this.notificationManager.show('Błąd podczas sortowania wyników', 'error');
                }
            });
        }
    }

    sortScores(scores, sortOption) {
        return [...scores].sort((a, b) => {
            const aTimestamp = typeof a.timestamp === 'string' ? new Date(a.timestamp).getTime() : a.timestamp;
            const bTimestamp = typeof b.timestamp === 'string' ? new Date(b.timestamp).getTime() : b.timestamp;
            
            switch (sortOption) {
                case 'date-desc':
                    return bTimestamp - aTimestamp;
                case 'date-asc':
                    return aTimestamp - bTimestamp;
                case 'weight-desc':
                    return b.weight - a.weight;
                case 'weight-asc':
                    return a.weight - b.weight;
                default:
                    return 0;
            }
        });
    }

    initializeElements() {
        if (this.initialized) return;
        this.initialized = true;
    
        this.scoreForm = document.getElementById('score-form');
        this.scoresList = document.getElementById('scores-list');
        if (this.scoreForm) {
            this.setupEventListeners();
        }
    }


    async handleScoreSubmit(e) {
        e.preventDefault();
        console.log("Obsługa formularza dodawania wyniku");
        const exerciseType = this.scoreForm['exercise-type'].value;
        const weight = parseFloat(this.scoreForm['weight'].value);
        const reps = parseInt(this.scoreForm['reps'].value);
    
        try {
            await this.scoreService.addScore(exerciseType, weight, reps);
            this.scoreForm.reset();
            await this.loadScores();
            this.notificationManager.show('Wynik został pomyślnie dodany.', 'success');
        } catch (error) {
            console.error("Błąd podczas dodawania wyniku:", error);
            this.notificationManager.show(error.message, 'error');
        }
    }

    async loadScores() {
        try {
            console.log("[ScoreDisplay] Ładowanie wyników");
            const scores = await this.scoreService.loadScores();
            console.log("[ScoreDisplay] Załadowane wyniki:", scores);
            this.displayScores(scores);
        } catch (error) {
            console.error("[ScoreDisplay] Błąd podczas ładowania wyników:", error);
            this.notificationManager.show('Błąd podczas ładowania wyników', 'error');
        }
    }

    async handleDeleteScore(scoreId) {
        const dialog = document.getElementById('custom-confirm-dialog');
        const confirmBtn = document.getElementById('confirm-delete');
        const cancelBtn = document.getElementById('cancel-delete');
    
        dialog.classList.remove('hidden');
    
        return new Promise((resolve) => {
            const handleConfirm = async () => {
                dialog.classList.add('hidden');
                try {
                    await this.scoreService.deleteScore(scoreId);
                    await this.loadScores();
                    if (this.notificationManager) {
                        this.notificationManager.show('Wynik został pomyślnie usunięty.', 'success');
                    }
                } catch (error) {
                    console.error('Error deleting score:', error);
                    if (this.notificationManager) {
                        this.notificationManager.show('Wystąpił błąd podczas usuwania wyniku.', 'error');
                    }
                }
                cleanup();
                resolve();
            };
    
            const handleCancel = () => {
                dialog.classList.add('hidden');
                cleanup();
                resolve();
            };
    
            const cleanup = () => {
                confirmBtn.removeEventListener('click', handleConfirm);
                cancelBtn.removeEventListener('click', handleCancel);
            };
    
            confirmBtn.addEventListener('click', handleConfirm);
            cancelBtn.addEventListener('click', handleCancel);
        });
    }

    displayScores(scores) {
        const scoresContainer = document.querySelector('.scores-list-container');
        if (!scoresContainer) {
            console.error("Element scores-list-container nie został znaleziony!");
            return;
        }
        console.log("Wyświetlanie wyników:", scores);
        scoresContainer.innerHTML = '';
        
        // Grupa wyników według daty
        const groupedScores = scores.reduce((acc, score) => {
            const date = new Date(score.timestamp);
            const dateString = date.toLocaleDateString();
            const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            if (!acc[dateString]) {
                acc[dateString] = [];
            }
            acc[dateString].push({ ...score, time: timeString });
            return acc;
        }, {});

        // Sortuj daty od najnowszej do najstarszej
        const sortedDates = Object.keys(groupedScores).sort((a, b) => {
            return new Date(b) - new Date(a);
        });

        // Wyświetl wyniki zgrupowane według daty
        for (const date of sortedDates) {
            const dateHeader = document.createElement('h3');
            dateHeader.textContent = date;
            scoresContainer.appendChild(dateHeader);

            // Sortuj wyniki według godziny (od najnowszej do najstarszej)
            const sortedScores = groupedScores[date].sort((a, b) => {
                return b.timestamp - a.timestamp;
            });

            sortedScores.forEach(score => {
                const li = document.createElement('li');
                
                // Kontener na treść wyniku
                const scoreContent = document.createElement('span');
                scoreContent.textContent = `${score.exerciseType}: ${score.weight}kg x ${score.reps} reps (dodano o ${score.time})`;
                li.appendChild(scoreContent);

                // Przycisk usuwania
                const deleteButton = document.createElement('button');
                deleteButton.innerHTML = '<i class="fas fa-trash-alt"></i> Usuń';
                deleteButton.classList.add('delete-button');
                deleteButton.addEventListener('click', () => this.handleDeleteScore(score.id));
                li.appendChild(deleteButton);

                scoresContainer.appendChild(li);
            });
        }
    }
    updateOverview() {
        const scores = this.scoreService.loadScores();
        scores.then(data => {
            // Sortuj wyniki od najnowszego do najstarszego
            const sortedScores = data.sort((a, b) => b.timestamp - a.timestamp);
    
            // Ostatni trening
            if (sortedScores.length > 0) {
                const lastWorkout = sortedScores[0];
                document.getElementById('last-workout-date').textContent = new Date(lastWorkout.timestamp).toLocaleDateString();
                document.getElementById('last-workout-details').textContent = `${lastWorkout.exerciseType}: ${lastWorkout.weight}kg x ${lastWorkout.reps}`;
            } else {
                document.getElementById('last-workout-date').textContent = 'Brak treningów';
                document.getElementById('last-workout-details').textContent = '';
            }
    
            // Liczba treningów
            document.getElementById('total-workouts').textContent = sortedScores.length;
    
            // Ulubione ćwiczenie
            const exerciseCounts = {};
            sortedScores.forEach(score => {
                exerciseCounts[score.exerciseType] = (exerciseCounts[score.exerciseType] || 0) + 1;
            });
            const favoriteExercise = Object.entries(exerciseCounts).sort((a, b) => b[1] - a[1])[0];
            document.getElementById('favorite-exercise').textContent = favoriteExercise ? favoriteExercise[0] : 'Brak danych';
    
            // Ostatnie treningi - tylko 5 ostatnich
            const recentWorkoutsList = document.getElementById('recent-workouts-list');
            recentWorkoutsList.innerHTML = '';
            // Używamy slice(0, 5) aby pobrać tylko pierwsze 5 elementów
            sortedScores.slice(0, 5).forEach(score => {
                const li = document.createElement('li');
                li.textContent = `${new Date(score.timestamp).toLocaleDateString()} - ${score.exerciseType}: ${score.weight}kg x ${score.reps}`;
                recentWorkoutsList.appendChild(li);
            });
        });
    }
}