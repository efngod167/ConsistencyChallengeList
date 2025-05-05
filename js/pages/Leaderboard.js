import { fetchLeaderboard } from '../content.js';
import { localize } from '../util.js';
import Spinner from '../components/Spinner.js';

export default {
  components: { Spinner },
  data: () => ({
    leaderboard: [],
    loading: true,
    selected: 0,
    err: [],
    searchQuery: "" // for filtering the leaderboard
  }),
  computed: {
    filteredLeaderboard() {
      if (!this.searchQuery) return this.leaderboard;
      return this.leaderboard.filter(entry =>
        entry.user &&
        entry.user.toLowerCase().includes(this.searchQuery.toLowerCase())
      );
    },
    selectedEntry() {
      // Only return a selected item if it exists in the filtered leaderboard.
      return this.filteredLeaderboard[this.selected] || null;
    },
    selectedRank() {
      if (!this.selectedEntry) {
        return "-";
      }
      // Find original rank in the full leaderboard
      let idx = this.leaderboard.findIndex(
        e => e.user === this.selectedEntry.user
      );
      return idx >= 0 ? idx + 1 : this.selected + 1;
    }
  },
  watch: {
    // Whenever the search query changes, reset the selected index.
    searchQuery() {
      this.selected = 0;
    }
  },
  async mounted() {
    const [leaderboard, err] = await fetchLeaderboard();
    this.leaderboard = leaderboard;
    this.err = err;
    this.loading = false;
  },
  methods: {
    localize,
  },
  template: `
    <main v-if="loading">
      <Spinner></Spinner>
    </main>
    <main v-else class="page-leaderboard-container">
      <div class="page-leaderboard">
        <div class="error-container">
          <p class="error" v-if="err.length > 0">
            Leaderboard may be incorrect, as the following levels could not be loaded: {{ err.join(', ') }}
          </p>
        </div>
        <div class="board-container">
          <!-- Leaderboard search bar -->
          <div class="search-bar">
            <input type="text" v-model="searchQuery" placeholder="Search users..." />
          </div>
          <table class="board">
            <tr v-for="(entry, i) in filteredLeaderboard" :key="i">
              <td class="rank">
                <p class="type-label-lg">#{{ i + 1 }}</p>
              </td>
              <td class="total">
                <p class="type-label-lg">{{ localize(entry.total) }}</p>
              </td>
              <td class="user" :class="{ 'active': selected === i }">
                <button @click="selected = i">
                  <span class="type-label-lg">{{ entry.user }}</span>
                </button>
              </td>
            </tr>
          </table>
          <p v-if="filteredLeaderboard.length === 0" class="no-results">
            No results found for "{{ searchQuery }}"
          </p>
        </div>
        <!-- Details panel: only display if there is a valid selection -->
        <div class="player-container" v-if="selectedEntry">
          <div class="player">
            <h1>#{{ selectedRank }} {{ selectedEntry.user }}</h1>
            <h3>{{ localize(selectedEntry.total) }}</h3>
            <h2 v-if="selectedEntry.verified && selectedEntry.verified.length > 0">
              Verified ({{ selectedEntry.verified.length }})
            </h2>
            <table class="table" v-if="selectedEntry.verified && selectedEntry.verified.length > 0">
              <tr v-for="score in selectedEntry.verified">
                <td class="rank">
                  <p>#{{ score.rank }}</p>
                </td>
                <td class="level">
                  <a class="type-label-lg" target="_blank" :href="score.link">{{ score.level }}</a>
                </td>
                <td class="score">
                  <p>+{{ localize(score.score) }}</p>
                </td>
              </tr>
            </table>
            <h2 v-if="selectedEntry.completed && selectedEntry.completed.length > 0">
              Completed ({{ selectedEntry.completed.length }})
            </h2>
            <table class="table" v-if="selectedEntry.completed && selectedEntry.completed.length > 0">
              <tr v-for="score in selectedEntry.completed">
                <td class="rank">
                  <p>#{{ score.rank }}</p>
                </td>
                <td class="level">
                  <a class="type-label-lg" target="_blank" :href="score.link">{{ score.level }}</a>
                </td>
                <td class="score">
                  <p>+{{ localize(score.score) }}</p>
                </td>
              </tr>
            </table>
            <h2 v-if="selectedEntry.progressed && selectedEntry.progressed.length > 0">
              Progressed ({{ selectedEntry.progressed.length }})
            </h2>
            <table class="table" v-if="selectedEntry.progressed && selectedEntry.progressed.length > 0">
              <tr v-for="score in selectedEntry.progressed">
                <td class="rank">
                  <p>#{{ score.rank }}</p>
                </td>
                <td class="level">
                  <a class="type-label-lg" target="_blank" :href="score.link">
                    {{ score.percent }}% {{ score.level }}
                  </a>
                </td>
                <td class="score">
                  <p>+{{ localize(score.score) }}</p>
                </td>
              </tr>
            </table>
          </div>
        </div>
      </div>
    </main>
  `
};
