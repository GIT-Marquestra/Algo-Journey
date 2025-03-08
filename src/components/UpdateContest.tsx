import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Clock, X, Save, Loader2, Search, Users } from 'lucide-react';
import Link from 'next/link';
import { Checkbox } from './ui/checkbox';
import { useSocket } from '@/hooks/SocketContext';

interface QuestionOnContest {
  questionId: string;
  question: Question;
}

interface Question {
  id: string;
  leetcodeUrl: string;
  codeforcesUrl: string;
  questionTags: { id: string; name: string; }[];
  slug: string;
  difficulty: string;
}


interface Group {
  id: string;
  name: string;
}


interface Contest {
  id: string;
  questions: QuestionOnContest[];
  startTime: string;
  endTime: string;
  duration: number;
}

export default function UpdateContestCard(dbQuestions: { dbQuestions: Question[] }) {
  const [contestId, setContestId] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingContest, setFetchingContest] = useState(false);
  const [contest, setContest] = useState<Contest | null>(null);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [duration, setDuration] = useState(2);
  const [dateError, setDateError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [allGroups, setAllGroups] = useState<Group[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [groupSearchTerm, setGroupSearchTerm] = useState('');
  const [filteredGroups, setFilteredGroups] = useState<Group[]>([]);
  const { socket } = useSocket()

  const fetchContestDetails = async () => {
    if (!contestId.trim()) {
      toast.error('Please enter a contest ID');
      return;
    }

    setFetchingContest(true);
    try {
      const [contestResponse, groupsResponse, permissionsResponse] = await Promise.all([
        axios.post('/api/getContest', { contestId }),
        axios.post('/api/getGroups'),
        axios.post('/api/getGroupPermission', { contestId })
      ]);

      const contestData = contestResponse.data.contest;
      if (!contestData) {
        toast.error('Contest not found');
        setShowForm(false);
        setFetchingContest(false);
        return;
      }

      if(permissionsResponse.status === 204){
        toast.error(permissionsResponse.data.message)
      }

      setContest(contestData);
      setStartTime(formatDateForInput(contestData.startTime));
      setEndTime(formatDateForInput(contestData.endTime));
      setDuration(contestData.duration);
      setShowForm(true);
      
      setAvailableQuestions(dbQuestions.dbQuestions);
      setFilteredQuestions(dbQuestions.dbQuestions);

      setAllGroups(groupsResponse.data.groups);
      setFilteredGroups(groupsResponse.data.groups);
      setSelectedGroups(permissionsResponse.data.permittedGroups);

    } catch (error) {
      console.error('Error fetching contest details:', error);
      toast.error('Failed to fetch contest details');
    }
    setFetchingContest(false);
  };

  const handleAddinRealTime = (q: Question) => {
    toast.success('correct')
    const contestID = parseInt(contestId)
    socket?.emit('addQuestion', {q, contestId: contestID})
  }

  const confirmAdd = (q: Question) => {
    toast((t) => (
      <div className="flex flex-col">
        <p className="font-semibold">How to Add?</p>
        <div className="flex gap-2 mt-2">
          <button 
            onClick={() => {
              toast.dismiss(t.id);
              handleAddinRealTime(q);
            }} 
            className="bg-red-500 text-white px-3 py-1 rounded"
          >
            Add in real time
          </button>
          <button 
            onClick={() => {
              toast.dismiss(t.id)
              addQuestionToContest(q)
            }} 
            className="bg-gray-300 px-3 py-1 rounded"
          >
            Add normally
          </button>
        </div>
      </div>
    ), { duration: 5000 }); 
  };


  useEffect(() => {
    if (allGroups.length) {
      const filtered = allGroups.filter((group) => 
        group.name.toLowerCase().includes(groupSearchTerm.toLowerCase())
      );
      setFilteredGroups(filtered);
    }
  }, [groupSearchTerm, allGroups]);


  const formatDateForInput = (dateString: string) => {
    const date = new Date(dateString);
    return date.toISOString().slice(0, 16);
  };


  const toggleGroupSelection = (groupId: string) => {
    setSelectedGroups(prev => 
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };


  const formatDateForPrisma = (dateString: string) => {
    const date = new Date(dateString);
    const offset = date.getTimezoneOffset();
    const utcDate = new Date(date.getTime() - (offset * 60000));
    return utcDate.toISOString();
  };

  const selectAllGroups = () => {
    const filteredGroupIds = filteredGroups.map(group => group.id);
    setSelectedGroups(prev => {
      const uniqueIds = new Set([...prev, ...filteredGroupIds]);
      return Array.from(uniqueIds);
    });
  };


  const deselectAllGroups = () => {
    const filteredGroupIds = new Set(filteredGroups.map(group => group.id));
    setSelectedGroups(prev => prev.filter(id => !filteredGroupIds.has(id)));
  };


  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setDuration(isNaN(value) ? 1 : Math.max(1, value));
  };


  const validateDates = () => {
    if (!startTime || !endTime) {
      setDateError('Please select both start and end times');
      return false;
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (end <= start) {
      setDateError('End time must be after start time');
      return false;
    }

    setDateError('');
    return true;
  };

  useEffect(() => {
    if (availableQuestions.length) {
      const filtered = availableQuestions.filter(q => 
        q.slug.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredQuestions(filtered);
    }
  }, [searchTerm, availableQuestions]);


  const addQuestionToContest = (question: Question) => {
    if (!contest) return;
    
    if (contest.questions.some(q => q.questionId === question.id)) {
      toast.error('This question is already in the contest');
      return;
    }
    
    setContest({
      ...contest,
      questions: [...contest.questions, { questionId: question.id, question: question }]
    });
    toast.success(`Added ${question.slug} to contest`);
  };


  const removeQuestionFromContest = (questionId: string) => {
    if (!contest) return;
    
    setContest({
      ...contest,
      questions: contest.questions.filter(q => q.questionId !== questionId)
    });
    toast.success('Question removed from contest');
  };


  const handleUpdateContest = async () => {
    if (!contest) return;
    
    if (!validateDates()) {
      return;
    }
    
    if (contest.questions.length === 0) {
      toast.error('Contest must have at least one question');
      return;
    }
    
    setLoading(true);
    try {
      const updateData = {
        contestId: contest.id,
        questions: contest.questions,
        startTime: formatDateForPrisma(startTime),
        endTime: formatDateForPrisma(endTime),
        duration,
        permittedGroups: selectedGroups
      };
      console.log(updateData)
      
      const response = await axios.post('/api/updateContest', updateData);
      if(response.status === 200){
        toast.success('Contest updated successfully!');
        setShowForm(false);
        setContest(null);
        setContestId('');
      }
      else{
        toast.error('Failed to update contest');
      }
    } catch (error) {
      console.error('Error updating contest:', error);
      toast.error('Failed to update contest');
    } finally {
      setLoading(false);
    }
  };
  

  const getDifficultyColor = (difficulty: string): string => {
    const colors: Record<string, string> = {
      BEGINNER: 'bg-green-500/10 text-green-500',
      EASY: 'bg-green-500/10 text-green-500',
      MEDIUM: 'bg-yellow-500/10 text-yellow-500',
      HARD: 'bg-red-500/10 text-red-500',
      VERYHARD: 'bg-red-700/10 text-red-700'
    };
    return colors[difficulty.toUpperCase()] || 'bg-gray-500/10 text-gray-500';
  };

  return (
    <Card className='w-96'>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Update Contest
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!showForm ? (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter Contest ID"
                value={contestId}
                onChange={(e) => setContestId(e.target.value)}
              />
              <Button 
                onClick={fetchContestDetails}
                disabled={fetchingContest}
              >
                {fetchingContest ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4 mr-1" />}
                {fetchingContest ? 'Fetching...' : 'Fetch Contest'}
              </Button>
            </div>
          </div>
        ) : contest ? (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Contest Settings</h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Contest Duration (minutes)</label>
                  <Input
                    type="number"
                    min="1"
                    max="1440"
                    value={duration}
                    onChange={handleDurationChange}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Start Time</label>
                  <Input
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">End Time</label>
                  <Input
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>
              {dateError && (
                <p className="text-sm text-destructive">{dateError}</p>
              )}
           
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Current Questions</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto p-2 border rounded-md">
                {contest.questions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No questions in this contest.</p>
                ) : (
                  contest.questions.map((q) => (
                    <div key={q.questionId} className="flex items-center justify-between p-2 rounded-lg border">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{q.question.slug}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${getDifficultyColor(q.question.difficulty)}`}>
                          {q.question.difficulty}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeQuestionFromContest(q.questionId)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Add Questions</h3>
              <Input
                placeholder="Search questions by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="space-y-2 max-h-60 overflow-y-auto p-2 border rounded-md">
                {filteredQuestions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No questions found.</p>
                ) : (
                  filteredQuestions.map((q) => (
                    <div key={q.id} className="flex items-center justify-between p-2 rounded-lg border">
                      <div className="flex items-center gap-2">
                        <Link href={q.leetcodeUrl ? q.leetcodeUrl : q.codeforcesUrl || ''} target='_blank'>
                          <span className="font-medium text-blue-700">{q.slug}</span>
                        </Link>
                        <span className={`text-xs px-2 py-1 rounded-full ${getDifficultyColor(q.difficulty)}`}>
                          {q.difficulty}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => confirmAdd(q)}
                        // onClick={() => addQuestionToContest(q)}
                        disabled={contest.questions.some(cq => cq.questionId === q.id)}
                      >
                        {contest.questions.some(cq => cq.questionId === q.id) ? 'Added' : 'Add'}
                      </Button>
                      
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Users className="w-5 h-5" />
                Group Permissions
              </h3>
              <div className="space-y-2">
                <Input
                  placeholder="Search groups..."
                  value={groupSearchTerm}
                  onChange={(e) => setGroupSearchTerm(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={selectAllGroups}
                  >
                    Select All Filtered
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={deselectAllGroups}
                  >
                    Deselect All Filtered
                  </Button>
                </div>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto p-2 border rounded-md">
                {filteredGroups.map((group) => (
                  <div
                    key={group.id}
                    className={`flex items-center justify-between p-2 rounded-lg border ${
                      selectedGroups.includes(group.id)
                        ? 'bg-primary/5'
                        : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={selectedGroups.includes(group.id)}
                        onCheckedChange={() => toggleGroupSelection(group.id)}
                        id={`group-${group.id}`}
                      />
                      <label
                        htmlFor={`group-${group.id}`}
                        className="text-sm font-medium"
                      >
                        {group.name}
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setContest(null);
                  setContestId('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateContest}
                disabled={loading}
                className="flex items-center gap-2"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {loading ? 'Updating...' : 'Update Contest'}
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}