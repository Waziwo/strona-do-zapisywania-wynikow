export class ScoreDisplay {
    constructor(scoreService, authService) {
        this.scoreService = scoreService;
        this.authService = authService;
        this.scoreForm = null;
        this.scoresList = null;
    }
    init() {
        this.initializeElements();
        this.loadScores();
        this.setupFilteringAndSorting();
    }

    setupFilteringAndSorting() {
        const filterForm = document.getElementById('filter-form');
        const sortSelect = document.getElementById('sort-select');

        filterForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const filters = {
                exerciseType: filterForm['filter-exercise'].value,
                dateFrom: filterForm['filter-date-from'].value,
                dateTo: filterForm['filter-date-to'].value
            };
            const filteredScores = await this.scoreService.getFilteredScores(filters);
            this.displayScores(filteredScores);
        });

        sortSelect.addEventListener('change', async () => {
            const [sortBy, sortOrder] = sortSelect.value.split('-');
            const scores = await this.scoreService.loadScores();
            const sortedScores = this.scoreService.sortScores(scores, sortBy, sortOrder);
            this.displayScores(sortedScores);
        });
    }

    initializeElements() {
        this.scoreForm = document.getElementById('score-form');
        this.scoresList = document.getElementById('scores-list');
        if (this.scoreForm) {
            this.setupEventListeners();
        }
    }

    setupEventListeners() {
        this.scoreForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleScoreSubmit(e);
        });
    }

    async handleScoreSubmit(e) {
        e.preventDefault();  // Dodaj to, aby zapobiec odświeżaniu strony
        const exerciseType = this.scoreForm['exercise-type'].value;
        const weight = parseFloat(this.scoreForm['weight'].value);
        const reps = parseInt(this.scoreForm['reps'].value);
    
        try {
            const user = await this.authService.getCurrentUser();
            if (!user) {
                throw new Error('Musisz być zalogowany aby dodać wynik');
            }
            await this.scoreService.addScore(exerciseType, weight, reps);
            this.scoreForm.reset();
            await this.loadScores();  // Załaduj i wyświetl wyniki od razu po dodaniu
        } catch (error) {
            alert(error.message);
        }
    }

    async loadScores() {
        console.log("ScoreDisplay: Rozpoczęto ładowanie wyników");
        try {
            const scores = await this.scoreService.loadScores();
            console.log("ScoreDisplay: Załadowane wyniki:", scores);
            this.displayScores(scores);
        } catch (error) {
            console.error("ScoreDisplay: Błąd podczas ładowania wyników:", error);
        }
    }

    async handleDeleteScore(scoreId) {
        try {
            if (confirm('Czy na pewno chcesz usunąć ten wynik?')) {
                await this.scoreService.deleteScore(scoreId);
                await this.loadScores(); // Odśwież listę po usunięciu
            }
        } catch (error) {
            console.error('Error deleting score:', error);
            alert('Wystąpił błąd podczas usuwania wyniku');
        }
    }

    displayScores(scores) {
        if (!this.scoresList) return;

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

        this.scoresList.innerHTML = '';

        // Sortuj daty od najnowszej do najstarszej
        const sortedDates = Object.keys(groupedScores).sort((a, b) => {
            return new Date(b) - new Date(a);
        });

        // Wyświetl wyniki zgrupowane według daty
        for (const date of sortedDates) {
            const dateHeader = document.createElement('h3');
            dateHeader.textContent = date;
            this.scoresList.appendChild(dateHeader);

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
                deleteButton.textContent = 'Usuń';
                deleteButton.classList.add('delete-button');
                deleteButton.addEventListener('click', () => this.handleDeleteScore(score.id));
                li.appendChild(deleteButton);

                this.scoresList.appendChild(li);
            });
        }
    }
}