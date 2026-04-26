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
              <p v-if="getOriginalRank(item[0]) <= 200" class="type-label-lg">
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
          <p v-if="selectedIndexInFullList <= 100">
            <strong>{{ selectedLevel.percentToQualify }}%</strong> to qualify
          </p>
          <p v-else-if="selectedIndexInFullList <= 200">
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
            <h4>List Editors</h4>
            <ol class="editors">
              <li v-for="editor in editors" :key="editor.name">
                <img :src="\`/assets/\${roleIconMap[editor.role]}\${store.dark ? '-dark' : ''}.svg\`" :alt="editor.role">
                <a v-if="editor.link" class="type-label-lg link" target="_blank" :href="editor.link">{{ editor.name }}</a>
                <p v-else>{{ editor.name }}</p>
              </li>
            </ol>
          </template>
        <h4>Level Requirements</h4>
        <p>Your level <b>must be consistency based.</b> A good example of a consistency challenge is <b>DIOOZ</b> by JoinMolten, and a bad example is <b>true binjus chal</b> by uwoGD. Challenges that repeat a specific part of the level aren't allowed, as they aren't really considered a consistency challenge.</p>
		<p>There needs to be some effort put into your levels, as layouts aren't really allowed.</p>
		<p>The minimum amount of clicks or releases your challenge can have is 4. Anything below that <b>doesn't qualify</b> as a consistency challenge.</p>
        <p>The maximum CPS for your level <b>cannot</b> exceed 9.5 or higher.</p>
		<p>Your level <b>must be</b> under 30 seconds. Due to this rule, dupes such as <b>Ain Shams Self</b> have been removed for being above 30 seconds.</p>
		<p>If your level contains inappropriate content/elements such as suggestive art, swastikas, slurs etc. <b>it will not be added.</b> This rule also applies to controversies, for ex. <b>Epstein Files.</b></p>
        <p>You <b>cannot</b> include spam based parts (regarding the CPS rule) in your level.</p>
		<p>You are allowed to make dupes of challenges, if it's either an extension or a level repeated set times in a row, whatever can be considered a dupe. If the level has more than 2 dupes on the list, the easier level would have to be removed unless it's on the Legacy List.</p>
		<h4>Submission Requirements</h4>
        <p>FPS Bypass is allowed <b>as long as you're not</b> bypassing above 360 FPS or under 60 FPS. Physics Bypass, however, isn't allowed. This rule doesn't apply to levels possible <b>only</b> on set framerate.</p>
		<p>Each level has a stated version that you can play the level on. If you're making a 2.2 fix of a 2.1 level, it would not be allowed due to physics changes. If you don't know how to downgrade versions, you'll be provided with <a style="color: #03bafc" href="https://www.youtube.com/watch?v=JMBn04BWTJc">this tutorial.</a> If you have any issues, make sure to contact staff.</p>
        <p>Click Between Frames/Click on Steps/Click Between Steps/Click Between MoonFrosts records are allowed, unless the level is cube and the player is <b>not using</b> CBF/CBS.</p>
		<p>Before submitting, you <b>must</b> include an FPS/CPS Counter and a Cheat Indicator for legitimacy purposes. This applies to any version of Geometry Dash, unless you play without any mods and use the 2.2 built-in FPS Bypass. Mods that play sounds of clicking such as <b>Click Sounds</b> or <b>Click Sounds Lite</b> aren't allowed, as the clicks don't come from your input device.</p>
        <p>NoClip Accuracy completions/verifications are <b>ABSOLUTELY</b> not allowed, as it is considered illegitimate towards the list.</p>
        <p>Alternating levels that were verified with single-tapping is <b>not allowed</b>. This rule is an exception, if you're fine with allowing Alternating for your level.</p>
        <p>You are allowed to use Show Hitboxes on Death, but your record will be denied if you use it for levels that are hard to see or are invisible, for ex. <b>tueml cereal</b>. If you're unsure if the level you're playing allows Show Hitboxes on Death, make sure to ask staff members!</p>
        <p>Once a level falls onto the Legacy List, we no longer accept records for them.</p>
		<h4>Allowed Hacks</h4>
		<p>If you want to make sure if some of the hacks that you use in your mod menu are allowed or not allowed, we will provide a sheet <a style="color: #03bafc" href="https://docs.google.com/spreadsheets/d/1s57VjhT-o9xGz-wYekG9jzxyFDtZkrRAVZxvFQrSMYE/edit?gid=1738567657#gid=1738567657">here</a> to check if one of the hacks you are using is again, either allowed or not allowed. If you want to report any issues or ask questions, ask the staff members. The sheet will be kept updated, so everything you see is not final!</p>
        </div>
      </div>
    </main>
  `,
};
