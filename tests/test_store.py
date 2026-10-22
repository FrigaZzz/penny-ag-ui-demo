import tempfile
import unittest
from pathlib import Path
from server import store
import json


class StoreTest(unittest.TestCase):
    def test_budget_changes_are_validated_atomic_and_revision_checked(self):
        with tempfile.TemporaryDirectory() as folder:
            original = store.DB
            try:
                store.DB = Path(folder) / "test.sqlite"
                store.init()
                initial = store.snapshot()
                rows = [{"type": "allocation", "category": c, "amount": v} for c, v in zip(store.CATEGORIES, store.LIMITS)]
                document = "\n".join(json.dumps(r) for r in rows)
                store.save_plan(document, initial["revision"])
                self.assertEqual(store.snapshot()["approvals"], 1)
                with self.assertRaises(ValueError):
                    store.save_plan(document, initial["revision"])
                for bad in ['null', '[]', document + '\n' + json.dumps(rows[0]), document.replace('165000', '-1'), document.replace('165000', '9999999'), document.replace('165000', 'true')]:
                    with self.assertRaises(ValueError):
                        store.save_plan(bad, 1)
                self.assertEqual(store.snapshot()["approvals"], 1)
                with self.assertRaises(ValueError):
                    store.set_goal(9999999)
                self.assertEqual(store.set_goal(150000)["goal"], 150000)
            finally:
                store.DB = original


if __name__ == "__main__":
    unittest.main()
