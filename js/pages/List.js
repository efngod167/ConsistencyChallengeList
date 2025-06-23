import { store } from "../main.js";
import { embed } from "../util.js";
import { score } from "../score.js";
import { fetchEditors, fetchList } from "../content.js";
import Spinner from "../components/Spinner.js";
import LevelAuthors from "../components/List/LevelAuthors.js";

const roleIconMap = {
  owner: "crown",
  admin: "user-gear",
  helper: "user-shield",
  dev: "code",
  trial: "user-lock",
};

export default {
  components: { Spinner, LevelAuthors },
  data: () => ({
    list: [],
    editors: [],
    loading: true,
    selected: 0,
    errors: [],
    searchQuery: "",
    roleIconMap,
    store,
  }),
  computed: {
    filteredList() {
      if (!this.searchQuery) return this.list;
      return this.list.filter(([level, err]) => {
        if (!level || !level.name) return false;
        return level.name.toLowerCase().includes(this.searchQuery.toLowerCase());
      });
    },
    selectedLevel() {
      return this.filteredList[this.selected]
        ? this.filteredList[this.selected][0]
        : null;
    },
    // Compute the original rank (index) in the full list for display purposes.
    selectedIndexInFullList() {
      if (!this.selectedLevel) return this.selected + 1;
      return (
        this.list.findIndex(
          (item) => item[0] && item[0].id === this.selectedLevel.id
        ) + 1
      );
    },
  },
  watch: {
    // Reset the selected index when the search query changes.
    searchQuery() {
      this.selected = 0;
    },
  },
  methods: {
    embed,
    score,
    getOriginalRank(level) {
      let index = this.list.findIndex(
        (item) => item[0] && item[0].id === level.id
      );
      return index >= 0 ? index + 1 : this.selected + 1;
    },
  },
  async mounted() {
    this.list = await fetchList();
    this.editors = await fetchEditors();
    if (!this.list) {
      this.errors = [
        "Failed to load list. Retry in a few minutes or notify list staff.",
      ];
    } else {
      this.errors.push(
        ...this.list
          .filter(([_, err]) => err)
          .map(([_, err]) => `Failed to load level. (${err}.json)`)
      );
      if (!this.editors) {
        this.errors.push("Failed to load list editors.");
      }
    }
    this.loading = false;
  },
  template: `
    <main v-if="loading">
      <Spinner></Spinner>
    </main>
    <main v-else class="page-list">
      <div class="list-container">
        <!-- Search Bar -->
        <div class="search-bar">
          <input type="text" v-model="searchQuery" placeholder="Search levels..." />
        </div>
        <table class="list" v-if="filteredList.length">
          <tr v-for="(item, i) in filteredList" :key="i">
            <td class="rank">
              <p v-if="getOriginalRank(item[0]) <= 150" class="type-label-lg">
                #{{ getOriginalRank(item[0]) }}
              </p>
              <p v-else class="type-label-lg">Legacy</p>
            </td>
            <td class="level" :class="{ 'active': selected === i, 'error': !item[0] }">
              <button @click="selected = i">
                <span class="type-label-lg">
                  {{ item[0]?.name || \`Error (\${item[1]}.json)\` }}
                </span>
              </button>
            </td>
          </tr>
        </table>
        <p v-if="filteredList.length === 0">No levels match your search.</p>
      </div>
      <div class="level-container" v-if="selectedLevel">
        <div class="level">
          <h1>{{ selectedLevel.name }}</h1>
          <LevelAuthors :author="selectedLevel.author" :creators="selectedLevel.creators" :verifier="selectedLevel.verifier"></LevelAuthors>
          <iframe class="video" id="videoframe" :src="embed(selectedLevel.showcase || selectedLevel.verification)" frameborder="0"></iframe>
          <ul class="stats">
            <li>
              <div class="type-title-sm">Points when completed</div>
              <p>
                {{
                  score(getOriginalRank(selectedLevel), 100, selectedLevel.percentToQualify)
                }}
              </p>
            </li>
            <li>
              <div class="type-title-sm">ID</div>
              <p>{{ selectedLevel.id }}</p>
            </li>
            <li>
              <div class="type-title-sm">FPS</div>
              <p>{{ selectedLevel.fps || 'Any' }}</p>
            </li>
            <li>
              <div class="type-title-sm">VERSION</div>
              <p>{{ selectedLevel.version || 'Any' }}</p>
            </li>
            <li>
              <div class="type-title-sm">AlTERNATING</div>
              <p>{{ selectedLevel.alternating || 'No' }}</p>
            </li>
          </ul>
          <h2>Records</h2>
          <p v-if="selectedIndexInFullList <= 75">
            <strong>{{ selectedLevel.percentToQualify }}%</strong> to qualify
          </p>
          <p v-else-if="selectedIndexInFullList <= 150">
            <strong>100%</strong> to qualify
          </p>
          <p v-else>This level does not accept new records.</p>
          <table class="records">
            <tr v-for="record in selectedLevel.records" class="record">
              <td class="percent">
                <p>{{ record.percent }}%</p>
              </td>
              <td class="user">
                <a :href="record.link" target="_blank" class="type-label-lg">{{ record.user }}</a>
              </td>
              <td class="mobile">
                <img v-if="record.mobile" :src="\`/assets/phone-landscape\${store.dark ? '-dark' : ''}.svg\`" alt="Mobile">
              </td>
              <td>
                <p>{{ record.hz }}</p>
              </td>
            </tr>
          </table>
        </div>
      </div>
      <div v-else class="level" style="height: 100%; justify-content: center; align-items: center;">
        
      </div>
      <div class="meta-container">
        <div class="meta">
          <div class="errors" v-show="errors.length > 0">
            <p class="error" v-for="error of errors">{{ error }}</p>
          </div>
          <div class="og">
            <p class="type-label-md">
              Website layout made by
              <a href="https://tsl.pages.dev/" target="_blank">TheShittyList</a>
            </p>
          </div>
          <template v-if="editors">
            <h3>List Editors</h3>
            <ol class="editors">
              <li v-for="editor in editors" :key="editor.name">
                <img :src="\`/assets/\${roleIconMap[editor.role]}\${store.dark ? '-dark' : ''}.svg\`" :alt="editor.role">
                <a v-if="editor.link" class="type-label-lg link" target="_blank" :href="editor.link">{{ editor.name }}</a>
                <p v-else>{{ editor.name }}</p>
              </li>
            </ol>
          </template>
          <h3>List Requirements</h3>
          <p>Every level must be consistency based.</p>
          <p>Maximum CPS for your level must not reach or be above 10.</p>
          <p>There must be clicks/taps in your completion/submission, however you are not allowed to use "Click Sounds" or "Click Sounds Lite" in Geode as they're click sounds, not real clicks.</p>
          <p>If your level contains inappropriate content (suggestive art, swastikas, slurs) it will not be added.</p>
          <p>You cannot include spam based parts (applies to the CPS rule) in your level.</p>
          <p>You're allowed to use FPS Bypass but verifications/completions above 360 FPS or under 60 FPS will not be accepted. This rule is an exception for 2.2 users, as going above 240 FPS will result in the game being locked to 240 FPS.</p>
          <p>CBF records are allowed for the list, however physics bypass is NOT allowed, but you can play in 2.1 to get up to 360 FPS.</p>
          <p>Cube Challenges are not allowed to be beaten with CBF, but with the FPS required for the level.</p>
          <p>NoClip Accuracy completions are ABSOLUTELY not allowed, as it is considered cheating and is an advantage to make the level "easier".</p>
          <p>Alternating levels will not be allowed on the list as a recent submission or record, exception being that you're allowed to alternate for only levels, such as "Diamond Blade End x20" and "Wave consistency inv".</p>
          <p>You are allowed to use Show Hitboxes on death, but your record will be denied if you use it for levels that are hard to see or are invisible, such as "haruna challenge", "Psbpm v2", "Alec Challenge", "tims time" and "Drunk Punch".</p>
          <p>If you were banned from the server due to a reason or few, you are still allowed to submit your records and levels by directly messaging list staff (pixelfactorial, galbereal, blightedcoconut_05273, sadisyourlife. or saturn_55004).</p>
          <p>Once a level falls onto the Legacy List, we no longer accept records for them.</p>
        </div>
      </div>
    </main>
  `,
};
