import unittest
from grade import assess,summary
class GradeTests(unittest.TestCase):
    def test_malformed_output_is_a_failure(self):
        row={'task':'assistant','output':{'kind':'general'},'checks':{'required':['answer']}}
        self.assertTrue(assess('not JSON',row)['issues'])
        self.assertTrue(assess('{"kind":"general","reply":123}',row)['issues'])
    def test_personal_claims_cannot_pass_general_checks(self):
        row={'task':'assistant','output':{'kind':'general'},'checks':{}}
        self.assertIn('uncited owner facts',assess('{"kind":"general","reply":"Rajat works at Google"}',row)['issues'])
    def test_invented_quote_is_rejected(self):
        row={'task':'rag','output':{'supported':True,'claims':[{'source_id':'a','text':'A fact'}]},'documents':[{'id':'a','text':'This is the complete actual evidence passage.'}]}
        result=assess('{"supported":true,"claims":[{"text":"A fact","source_id":"a","quote":"An invented passage that is not in the evidence"}]}',row)
        self.assertIn('invalid quote',result['issues'])
    def test_summary_does_not_hide_critical_failure(self):
        result=summary([{'task':'assistant','issues':[]},{'task':'assistant','issues':['wrong route'],'critical':True}])
        self.assertEqual(result['rate'],0.5)
        self.assertEqual(result['critical_failures'],1)
if __name__=='__main__':unittest.main()
