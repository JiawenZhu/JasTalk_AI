'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  RefreshCw, 
  Trash2, 
  Calendar, 
  Users, 
  MessageSquare,
  Filter,
  SortAsc,
  SortDesc
} from 'lucide-react';
import { useInterviews } from '@/contexts/interviews.context';
import { Interview } from '@/types/interview';
import InterviewCard from '@/components/dashboard/interview/interviewCard';
import { DeleteConfirmationModal } from '@/components/ui/delete-confirmation-modal';
import { useDeleteInterview } from '@/hooks/useDeleteInterview';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SortField = 'name' | 'created_at' | 'response_count' | 'updated_at';
type SortOrder = 'asc' | 'desc';

export default function InterviewManagement() {
  const { interviews, interviewsLoading, fetchInterviews } = useInterviews();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'archived'>('all');
  const [selectedInterviews, setSelectedInterviews] = useState<string[]>([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  const { deleteInterview, isDeleting } = useDeleteInterview({
    onSuccess: () => {
      fetchInterviews();
      setSelectedInterviews([]);
    }
  });

  // Filter and sort interviews
  const filteredAndSortedInterviews = useMemo(() => {
    let filtered = interviews.filter((interview) => {
      const matchesSearch = interview.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           interview.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus === 'all' || 
                           (filterStatus === 'active' && interview.is_active) ||
                           (filterStatus === 'archived' && interview.is_archived);
      
      return matchesSearch && matchesStatus;
    });

    // Sort interviews
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'name':
          aValue = a.name?.toLowerCase() || '';
          bValue = b.name?.toLowerCase() || '';
          break;
        case 'created_at':
          aValue = new Date(a.created_at || 0);
          bValue = new Date(b.created_at || 0);
          break;
        case 'response_count':
          aValue = a.response_count || 0;
          bValue = b.response_count || 0;
          break;
        default:
          aValue = a.created_at;
          bValue = b.created_at;
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [interviews, searchTerm, sortField, sortOrder, filterStatus]);

  const handleRefresh = () => {
    fetchInterviews();
  };

  const handleSelectInterview = (interviewId: string, selected: boolean) => {
    if (selected) {
      setSelectedInterviews(prev => [...prev, interviewId]);
    } else {
      setSelectedInterviews(prev => prev.filter(id => id !== interviewId));
    }
  };

  const handleSelectAll = () => {
    if (selectedInterviews.length === filteredAndSortedInterviews.length) {
      setSelectedInterviews([]);
    } else {
      setSelectedInterviews(filteredAndSortedInterviews.map(i => i.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedInterviews.length === 0) return;
    
    // Delete selected interviews one by one
    for (const interviewId of selectedInterviews) {
      const interview = interviews.find(i => i.id === interviewId);
      if (interview) {
        await deleteInterview(interviewId, interview.name || 'Unnamed Interview');
      }
    }
    
    setShowBulkDeleteModal(false);
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />;
  };

  const stats = useMemo(() => {
    const total = interviews.length;
    const active = interviews.filter(i => i.is_active).length;
    const archived = interviews.filter(i => i.is_archived).length;
    const totalResponses = interviews.reduce((sum, i) => sum + (i.response_count || 0), 0);

    return { total, active, archived, totalResponses };
  }, [interviews]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Interview Management</h2>
        <p className="text-gray-600">
          Manage all interviews in your organization. Delete, archive, and monitor interview performance.
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Interviews</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Archived</p>
                <p className="text-2xl font-bold text-gray-600">{stats.archived}</p>
              </div>
              <Calendar className="h-8 w-8 text-gray-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Responses</p>
                <p className="text-2xl font-bold text-purple-600">{stats.totalResponses}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search interviews..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>

              {/* Filter */}
              <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Interviews</SelectItem>
                  <SelectItem value="active">Active Only</SelectItem>
                  <SelectItem value="archived">Archived Only</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort */}
              <Select value={sortField} onValueChange={(value: any) => setSortField(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">Created Date</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="response_count">Responses</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                {getSortIcon(sortField) || <SortDesc className="h-4 w-4" />}
              </Button>
            </div>

            <div className="flex gap-2">
              {selectedInterviews.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowBulkDeleteModal(true)}
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Selected ({selectedInterviews.length})
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={interviewsLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${interviewsLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interview Grid */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Interviews ({filteredAndSortedInterviews.length})
            </CardTitle>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedInterviews.length === filteredAndSortedInterviews.length && filteredAndSortedInterviews.length > 0}
                onChange={handleSelectAll}
                className="rounded"
              />
              <span className="text-sm text-gray-600">Select All</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {interviewsLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              <span>Loading interviews...</span>
            </div>
          ) : filteredAndSortedInterviews.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No interviews found matching your criteria
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredAndSortedInterviews.map((interview) => (
                <div key={interview.id} className="relative">
                  <div className="absolute top-2 left-2 z-10">
                    <input
                      type="checkbox"
                      checked={selectedInterviews.includes(interview.id)}
                      onChange={(e) => handleSelectInterview(interview.id, e.target.checked)}
                      className="rounded bg-white shadow-sm"
                    />
                  </div>
                  <InterviewCard
                    id={interview.id}
                    interviewerId={interview.interviewer_id}
                    name={interview.name}
                    url={interview.url ?? ""}
                    readableSlug={interview.readable_slug}
                    hasCodingQuestions={interview.has_coding_questions}
                    codingQuestionCount={interview.coding_question_count}
                    showDeleteButton={true}
                    onDeleted={(deletedId) => {
                      fetchInterviews();
                      setSelectedInterviews(prev => prev.filter(id => id !== deletedId));
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showBulkDeleteModal}
        onClose={() => setShowBulkDeleteModal(false)}
        onConfirm={handleBulkDelete}
        title="Delete Multiple Interviews"
        description={`Are you sure you want to delete ${selectedInterviews.length} selected interview(s)? This will permanently remove all associated data including responses, feedback, and coding submissions. This action cannot be undone.`}
        isLoading={isDeleting}
        destructiveAction={`Delete ${selectedInterviews.length} Interview(s)`}
      />
    </div>
  );
} 
