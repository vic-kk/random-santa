# 🎁 Random Santa

A project for automatically drawing Secret Santas based on Google Forms responses.

## 🔄 How it works: two stages in the project's life

The project exists in two different states, which are configured separately. This allows for collecting participant data first and then conducting the drawing.

> [!TIP]
> The project supports both npm and yarn. All examples use npm; for yarn, simply replace `npm run` with `yarn`.

### 1️⃣ Step: Data Collection

**🎯 Purpose:** To collect participant data using Google Form.

#### 🚀 Quick Start for the Data Collection Step

1. **Install dependencies**

    ```bash
    npm i
    ```

2. **Configure a form link**
    - Create a Google Form for data collection
    - You can use UID prefilling (the example in the project uses it)
    - Specify a link to it in the [`src/data/externalLinks.ts`](src/data/externalLinks.ts) file

3. **Make sure collection mode is enabled**

    ```bash
    npm run stage -- 1
    ```

4. **Run locally to verify**

    ```bash
    npm run dev
    ```

5. **Build and publish the project**

    ```bash
    npm run build
    ```

    The completed build from the `docs/` folder is published on GitHub Pages.

### 2️⃣ Stage: Draw and Results

**🎯 Purpose:** Randomly match participants and show each one their recipient.

#### 🚀 Quick Start for the Giveaway Stage

1. **Prepare the Data**
    - Export responses from Google Forms
    - Rename the file to `SANTA.csv`
    - Place it in the `_local/` folder in the project root

    ```shell
    Structure after preparation:
    ├─📂 _local/
    │ ├─ SANTA.csv # responses from Google Forms
    │ └─ tip.txt
    └─ ...
    ```

2. **Make sure result display mode is enabled**
   
    ```bash
    npm run stage -- 3
    ```

3. **Run automatic processing**

    ```bash
    npm run santa_auto
    ```

    This command:
    - Makes a backup of the old draw, if any
    - Runs a new draw based on `SANTA.csv`
    - Creates the file [`src/data/addresses.ts`](src/data/addresses.ts) with the results
    - Builds the project for publication

4. **Publish the results**
    - The finished build from the `docs/` folder is published on GitHub Pages.

---

### 🔧 Manual Stage Management

If you need to separate stages (for example, to test the draw before building), use the following commands separately:

```bash
# 1. Run only the draw based on the SANTA.csv file
# The existing draw version will be moved to _local/backups
npm run santa

# 2. Run locally for preview
npm run dev

# 3. Build the project for deployment (GitHub Pages)
npm run build
```

---

## 🧪 For development and testing

### Generating test data

> [!WARNING]
> Generating test data will completely overwrite the `_local/SANTA.csv` file. Make sure important data is saved.

```bash
# Full cycle: generating 15 records + draw
npm run mock_auto

# CSV generation only
npm run mock_csv        # default, 15 records
npm run mock_csv -- N   # N records

```

### Changing stages

```bash
# Selecting a stage via dialog and building for publishing
npm run stage_auto

# Only changing stages for a local test
npm run stage       # Selecting a stage via dialog
npm run stage -- N  # Explicitly specifying a stage (1 = build, 2 = service, 3 = results)

```

## 📋 Command Reference (NPM/Yarn Scripts)

| Command | Action | Typical Scenario |
| :--- | :--- | :--- |
| **`santa_auto`** | **🎯 Basic command.** Runs draw and build for publishing. | Quick start for deployment. |
| **`santa`** | Runs only draw of recipients from `SANTA.csv`. | New draw. |
| **`dev`** | Starts a local dev server for viewing. | Develops and debugs the interface. |
| **`build`** | Builds the production version of the project. | Prepares for publication. |
| **`mock_auto`** | Generates a test CSV file (15 records) and runs the draw. | Full-cycle testing. |
| **`mock_csv[:N]`** | Generates only a test CSV file. | Creates data for debugging. |
| **`stage_auto`** | Requests the current stage and collects for publishing. | Changes the publishing stage. |
| **`stage[ -- N]`** | Sets the desired stage. | 1 = collecting, 2 = service, 3 = results |

---

## 📦 Project Structure

```shell
├─📂 _local/                # service folder (in .gitignore)
│  ├─ SANTA.csv              # raw data from Google Forms
│  ├─📂 backups/            # backup copies of draws
│  ├─📂 parced/             # processed data
│  └─ tip.txt
├─📂 docs/                  # compiled website for publication
├─📂 src/
│  ├─📂 data/
│  │  ├─ addresses.ts       # results of the current draw
│  │  └─ externalLinks.ts   # links to External resources
│  └─📂 features/
│     └─ features.ts        # stage and function settings
└─ ...
```